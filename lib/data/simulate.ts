/**
 * Telemetry simulator (TSK-02.4): replays one scenario trip as one sample per
 * minute, the way the truck's CAN fuel sensor and GPS would have reported it.
 *
 * - Speed is derived from the scenario's legs, so ∫speed dt equals the km.
 *   Within a leg the pace wiggles, and the leg's diesel follows the distance.
 * - Fuel = start − burnt + refuel rises − injected drops + sensor noise.
 *   The noise is seeded per trip: a ±0.12 L jitter plus isolated slosh spikes
 *   of 1.30–1.45 L (so |noise| ≤ 1.8 L, and a 5-sample median removes it).
 *   The first and last samples carry no noise.
 * - Ignition goes off 2 minutes into every stop except a refuel, and at arrival.
 * - FASTag events and refuel bills come straight from the scenario.
 *
 * The rules never see the scenario's injections: only this telemetry.
 * `tank` carries the settled, noise-free readings the ledger uses (§4.5, EXE6).
 */
import { DIESEL_INR_PER_L } from "./constants";
import { haversineM, offsetM } from "./geo";
import { placeById } from "./places";
import { mulberry32, SCENARIO_SEED } from "./prng";
import { routeById, routeScale } from "./routes";
import type { ScenarioStop, ScenarioTrip } from "./scenario/schema";
import type { LngLat, Min, Route, Sample, Trip } from "./types";

export interface SimulateContext {
  /** Replay only up to this minute (a trip still on the road at DEMO_NOW). */
  until?: Min;
}

/** Minutes over which a refuel's rise shows up on the sensor, starting 1 minute after the bill. */
export const REFUEL_RAMP_MIN = 6;
/** Stops (other than refuels) switch the ignition off after this many minutes. */
export const IGNITION_OFF_AFTER_MIN = 2;

const NOISE_JITTER_L = 0.12;
const SPIKE_MIN_L = 1.3;
const SPIKE_SPAN_L = 0.15;

/** FNV-1a, for a stable per-trip seed. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

/** Seeded sensor noise in litres, one value per sample; zero at both ends. */
export function sensorNoiseL(tripId: string, n: number): number[] {
  const rnd = mulberry32((hash32(tripId) ^ SCENARIO_SEED) >>> 0);
  const out: number[] = [];
  let nextSpike = 3 + Math.floor(rnd() * 8);
  for (let i = 0; i < n; i++) {
    let v = (rnd() - 0.5) * 2 * NOISE_JITTER_L;
    if (i === nextSpike) {
      v += (rnd() < 0.5 ? -1 : 1) * (SPIKE_MIN_L + rnd() * SPIKE_SPAN_L);
      nextSpike = i + 6 + Math.floor(rnd() * 9);
    }
    out.push(v);
  }
  if (n > 0) out[0] = 0;
  if (n > 1) out[n - 1] = 0;
  return out;
}

/** Maps distance driven (actual km) to progress along the route (planned km) plus a sideways offset. */
function progressMapper(s: ScenarioTrip, route: Route) {
  const extra = s.extraKm ?? 0;
  const actual = s.legs.reduce((a, l) => a + l.km, 0);
  if (!s.detour || extra === 0) {
    const k = extra > 0 ? route.plannedKm / actual : 1;
    return (c: number) => ({ km: c * k, sideKm: 0 });
  }
  const a = s.detour.fromKm;
  const len = s.detour.toKm - s.detour.fromKm;
  const w = Math.sqrt(((len + extra) / 2) ** 2 - (len / 2) ** 2);
  return (c: number) => {
    if (c <= a) return { km: c, sideKm: 0 };
    if (c >= a + len + extra) return { km: c - extra, sideKm: 0 };
    const f = (c - a) / (len + extra);
    return { km: a + f * len, sideKm: w * (1 - Math.abs(2 * f - 1)) };
  };
}

const pathIndex = new WeakMap<Route, { cum: Float64Array; scale: number }>();

/**
 * pointAtKm (routes.ts) with the path's cumulative lengths cached per route and
 * a binary search, instead of re-measuring every segment on every call.
 * Same interpolation, so the same points.
 */
function pointAtKm(route: Route, km: number): LngLat {
  const path = route.path;
  if (km <= 0) return [...path[0]];
  if (km >= route.plannedKm) return [...path[path.length - 1]];
  let idx = pathIndex.get(route);
  if (!idx) {
    const cum = new Float64Array(path.length);
    for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + haversineM(path[i - 1], path[i]);
    idx = { cum, scale: routeScale(route) };
    pathIndex.set(route, idx);
  }
  const { cum } = idx;
  const along = (km * 1000) / idx.scale;
  let lo = 1;
  let hi = path.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] >= along) hi = mid;
    else lo = mid + 1;
  }
  while (lo < path.length - 1 && cum[lo] === cum[lo - 1]) lo++;
  const seg = cum[lo] - cum[lo - 1];
  if (seg <= 0 || cum[lo] < along) return [...path[path.length - 1]];
  const f = (along - cum[lo - 1]) / seg;
  const a = path[lo - 1];
  const b = path[lo];
  return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
}

function routePoint(route: Route, km: number, sideKm: number): LngLat {
  const p = pointAtKm(route, km);
  if (sideKm === 0) return p;
  const a = pointAtKm(route, Math.max(0, km - 0.5));
  const b = pointAtKm(route, Math.min(route.plannedKm, km + 0.5));
  const east = (b[0] - a[0]) * Math.cos((p[1] * Math.PI) / 180);
  const north = b[1] - a[1];
  const norm = Math.hypot(east, north) || 1;
  // Left of the direction of travel.
  return offsetM(p, (-north / norm) * sideKm * 1000, (east / norm) * sideKm * 1000);
}

function stopPoint(stop: ScenarioStop): LngLat | null {
  if (stop.lngLat) return stop.lngLat;
  if (stop.placeId) return placeById(stop.placeId).lngLat;
  return null;
}

/** Replays a scenario trip as per-minute telemetry. */
export function simulateTrip(s: ScenarioTrip, ctx: SimulateContext = {}): Trip {
  const route = routeById(s.routeId);
  const last = Math.min(s.end, ctx.until ?? s.end);
  if (last < s.start) throw new RangeError(`simulateTrip: ${s.id} has not started by ${last}`);
  const minutes = s.end - s.start;

  // Per-minute distance and burn over [start, end).
  const kmMin = new Float64Array(minutes);
  const burnMin = new Float64Array(minutes);
  const phaseRnd = mulberry32(hash32(`${s.id}/pace`));
  for (const leg of s.legs) {
    const n = leg.to - leg.from;
    if (n <= 0) throw new RangeError(`simulateTrip: ${s.id} has an empty leg`);
    const ph1 = phaseRnd() * 17;
    const ph2 = phaseRnd() * 5.3;
    const w: number[] = [];
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const v = 1 + 0.1 * Math.sin((2 * Math.PI * (k + ph1)) / 17) + 0.05 * Math.sin((2 * Math.PI * (k + ph2)) / 5.3);
      w.push(v);
      sum += v;
    }
    for (let k = 0; k < n; k++) {
      const i = leg.from - s.start + k;
      kmMin[i] = (leg.km * w[k]) / sum;
      burnMin[i] = (leg.fuelCl * w[k]) / sum;
    }
  }

  const drops = s.injections.flatMap((j) => (j.kind === "stationary-drop" ? [j] : []));
  const refuels = s.refuels;
  const tankAt = (t: Min, burnt: number) => {
    let v = s.startFuelCl - burnt;
    for (let k = 0; k < refuels.length; k++) {
      const r = refuels[k];
      if (t > r.t + 1) v += r.tankRiseCl * clamp01((t - (r.t + 1)) / REFUEL_RAMP_MIN);
    }
    for (let k = 0; k < drops.length; k++) {
      const d = drops[k];
      if (t > d.from) v -= d.litres * 100 * clamp01((t - d.from) / (d.to - d.from));
    }
    return v;
  };

  const toRoute = progressMapper(s, route);
  const noise = sensorNoiseL(s.id, s.end - s.start + 1);
  const samples: Sample[] = [];
  let cumKm = 0;
  let cumBurn = 0;
  let stopIdx = 0;
  for (let t = s.start; t <= last; t++) {
    const i = t - s.start;
    while (stopIdx < s.stops.length && s.stops[stopIdx].to <= t) stopIdx++;
    const stop = stopIdx < s.stops.length && s.stops[stopIdx].from <= t ? s.stops[stopIdx] : null;
    const moving = t < s.end && kmMin[i] > 0;
    let lngLat: LngLat;
    const sp = stop ? stopPoint(stop) : null;
    if (sp) lngLat = [...sp];
    else {
      const m = toRoute(cumKm);
      lngLat = routePoint(route, m.km, m.sideKm);
    }
    const ignition =
      t === s.end ? false : stop ? stop.kind === "refuel" || t < stop.from + IGNITION_OFF_AFTER_MIN : true;
    samples.push({
      t,
      lngLat,
      speedKmh: moving ? Math.round(kmMin[i] * 600) / 10 : 0,
      fuelCl: Math.round(tankAt(t, cumBurn) + noise[i] * 100),
      ignition,
    });
    if (t < s.end) {
      cumKm += kmMin[i];
      cumBurn += burnMin[i];
    }
  }
  // The loop advanced the cumulative values one minute past `last`; the tank reading is at `last`.
  const burntAtLast = last === s.end ? s.fuelUsedCl : cumBurn - burnMin[last - s.start];
  const kmAtLast = last === s.end ? s.legs.reduce((a, l) => a + l.km, 0) : cumKm - kmMin[last - s.start];

  return {
    id: s.id,
    plate: s.plate,
    routeId: s.routeId,
    start: s.start,
    end: s.end,
    loadT: s.loadT,
    cargo: s.cargo,
    freightInr: s.freightInr,
    claims: { tollsInr: s.tolls.claimedInr, allowanceInr: s.allowanceInr, otherInr: s.otherInr },
    samples,
    refuels: s.refuels
      .filter((r) => r.t <= last)
      .map((r) => ({
        t: r.t,
        placeId: r.placeId,
        billedCl: r.billedCl,
        billedInr: Math.round((r.billedCl * DIESEL_INR_PER_L) / 100),
        tankRiseCl: r.tankRiseCl,
      })),
    fastag: s.tolls.plazas.filter((p) => p.t <= last).map((p) => ({ t: p.t, placeId: p.placeId, inr: p.inr })),
    actualKm: Math.round(kmAtLast * 1000) / 1000,
    tank: { startCl: s.startFuelCl, endCl: Math.round(tankAt(last, burntAtLast)) },
  };
}
