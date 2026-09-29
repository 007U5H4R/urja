/**
 * The trip route map's view model (TKT-10, TSK-10.4): a port of map.js
 * `tripMap()` whose geometry comes from the trip itself, not the mockup.
 *
 * - `plan` is the route's planned path (dashed); `actual` is the GPS trace,
 *   simplified (solid). Both are plain [lng, lat] arrays for the client.
 * - `focus` is where the lamp pool sits: the flagged spot (R1 the stop, R2
 *   the pump, R4 the detour), the route's named stretch for R3 (no single
 *   spot), or the middle of the trace for a clean or live trip.
 * - `lit` is R4's extra-km segment (null otherwise).
 * - `events` are the markers: the ends, the checked stops, the refuels and
 *   the flagged spot, in time order.
 */
import { DEMO_NOW } from "@/lib/clock";
import { formatTimeIST } from "@/lib/format";
import { flagsForTrip } from "../aggregates";
import { R4, r2Fires } from "../constants";
import { distanceToPathM, haversineM, pathLengthM, pointAlongPath } from "../geo";
import { getDataset, type ReadonlyFlag, type ReadonlyTrip } from "../index";
import { placeById } from "../places";
import { isLocalRoute, routeById, STRETCHES } from "../routes";
import { measureDeviation } from "../rules/r4-route";
import { smoothFuelCl } from "../rules/signal";
import type { LngLat, Min, Trip, TripId } from "../types";

export type MapEventKind = "end" | "ok" | "bad" | "fuel" | "";

export interface MapEvent {
  lngLat: LngLat;
  kind: MapEventKind;
  label: string;
  /** Minute of the event, for ordering. */
  at: Min;
}

export interface TripMapView {
  plan: LngLat[];
  actual: LngLat[];
  lit: LngLat[] | null;
  focus: LngLat;
  events: MapEvent[];
  /** [[west, south], [east, north]] around every drawn point. */
  bounds: [LngLat, LngLat];
  /** The map in words (TC-031). */
  ariaLabel: string;
}

/** Simplification tolerance: well under the 1.6 km Behror detour, well over GPS jitter. */
const SIMPLIFY_M = 50;
/** A steady stop's fuel moves by no more than this (the trip page's check). */
const STEADY_CL = 200;

const round5 = (x: number) => Math.round(x * 1e5) / 1e5;
const r5 = (p: readonly number[]): LngLat => [round5(p[0]), round5(p[1])];
const time = formatTimeIST;
const km1 = (m: number) => (Math.round(m / 100) / 10).toFixed(1);

/** Perpendicular distance (m) from p to segment ab, on a local equirectangular plane. */
function segmentDistanceM(p: LngLat, a: LngLat, b: LngLat): number {
  const kx = Math.cos((p[1] * Math.PI) / 180);
  const ax = (a[0] - p[0]) * kx;
  const ay = a[1] - p[1];
  const dx = (b[0] - a[0]) * kx;
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  const foot: LngLat = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  return haversineM(p, foot);
}

/**
 * Ramer–Douglas–Peucker on [lng, lat] with a tolerance in metres. Repeated
 * points go first; the ends always stay; the result is rounded to 5 decimals (~1 m).
 */
export function simplifyPath(path: readonly (readonly number[])[], toleranceM: number): LngLat[] {
  const pts: LngLat[] = [];
  for (const p of path) {
    const q = r5(p);
    const last = pts[pts.length - 1];
    if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
  }
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    let best = -1;
    let bi = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segmentDistanceM(pts[k], pts[i], pts[j]);
      if (d > best) {
        best = d;
        bi = k;
      }
    }
    if (bi >= 0 && best > toleranceM) {
      keep[bi] = 1;
      stack.push([i, bi], [bi, j]);
    }
  }
  return pts.filter((_, k) => keep[k] === 1);
}

const asTrip = (t: ReadonlyTrip) => t as unknown as Trip;
/** 'Jaipur Transport Nagar' → 'Jaipur'; 'Okhla, Delhi' → 'Okhla'. */
const shortPlace = (id: string) => placeById(id).name.en.replace(/ Transport Nagar$/, "").split(",")[0];
/** 'Jaipur Transport Nagar' → 'Jaipur'; 'Okhla, Delhi' stays. */
const endName = (id: string) => placeById(id).name.en.replace(/ Transport Nagar$/, "");
/** 'HP pump Neemrana' → 'Neemrana pump'; 'Kishangarh pump' stays. */
const pumpName = (id: string) => `${placeById(id).name.en.replace(/^HP pump /, "").replace(/ (highway )?pump$/, "")} pump`;
const L = (cl: number) => Math.round(cl / 100);

function sampleAt(trip: ReadonlyTrip, t: Min): LngLat {
  const s = trip.samples;
  const i = Math.max(0, Math.min(s.length - 1, t - trip.start));
  return r5(s[i].lngLat);
}

function segment(trip: ReadonlyTrip, from: Min, to: Min): LngLat[] {
  const s = trip.samples;
  const a = Math.max(0, from - trip.start);
  const b = Math.min(s.length - 1, to - trip.start);
  return simplifyPath(s.slice(a, b + 1).map((x) => x.lngLat), SIMPLIFY_M);
}

/** R4's extra-km segment: the flagged window, or the longest off-path stretch. */
function litSegment(trip: ReadonlyTrip, flag: ReadonlyFlag): LngLat[] | null {
  if (flag.until !== undefined && flag.at !== trip.start) {
    const seg = segment(trip, flag.at, flag.until);
    if (seg.length >= 2) return seg;
  }
  const dev = measureDeviation(asTrip(trip));
  if (dev?.offPathFrom != null && dev.offPathTo != null) {
    const seg = segment(trip, dev.offPathFrom, dev.offPathTo);
    if (seg.length >= 2) return seg;
  }
  return null;
}

function midpoint(path: readonly LngLat[]): LngLat {
  return r5(pointAlongPath(path, pathLengthM(path) / 2));
}

const cache = new Map<TripId, TripMapView>();

/** The route map for a trip with a page (finished or live); null for any other id. */
export function getTripMapView(tripId: string): TripMapView | null {
  const hit = cache.get(tripId);
  if (hit) return hit;
  const ds = getDataset();
  const done = ds.trips.find((t) => t.id === tripId);
  const trip = done ?? ds.live.find((t) => t.id === tripId);
  if (!trip) return null;
  const v = build(trip, done ? "done" : "live");
  cache.set(tripId, v);
  return v;
}

function build(trip: ReadonlyTrip, status: "done" | "live"): TripMapView {
  const route = routeById(trip.routeId);
  const local = isLocalRoute(route.id);
  const flag = status === "done" ? (flagsForTrip(trip.id)[0] ?? null) : null;
  const lastT = trip.samples[trip.samples.length - 1].t;
  const plan = route.path.map((p) => [p[0], p[1]] as LngLat);
  const actual = simplifyPath(
    trip.samples.map((s) => s.lngLat),
    SIMPLIFY_M,
  );
  const lit = flag?.rule === "R4" ? litSegment(trip, flag) : null;
  const scenarioTrip = getDataset().scenario.trips.find((s) => s.id === trip.id);
  const stops = (scenarioTrip?.stops ?? []).filter((s) => s.from <= lastT);
  const smooth = smoothFuelCl(asTrip(trip).samples);

  // ── Events ──
  const events: MapEvent[] = [];
  events.push({ lngLat: sampleAt(trip, trip.start), kind: "end", label: `${shortPlace(route.from)} · ${time(trip.start)}`, at: trip.start });
  for (const stop of stops) {
    if (stop.kind === "refuel") continue;
    const flagged = flag?.rule === "R1" && flag.at >= stop.from && flag.at < stop.to;
    if (flagged) continue;
    const a = stop.from - trip.start;
    const b = Math.min(stop.to - 1, lastT) - trip.start;
    if (a < 0 || b < a) continue;
    const steady = Math.abs(smooth[a] - smooth[b]) <= STEADY_CL;
    const name = stop.placeId
      ? placeById(stop.placeId).name.en
      : stop.kind === "dhaba"
        ? "Dhaba stop"
        : stop.kind === "rest"
          ? "Rest stop"
          : "Stop";
    const where: LngLat = stop.lngLat ? r5(stop.lngLat) : stop.placeId ? r5(placeById(stop.placeId).lngLat) : sampleAt(trip, stop.from);
    events.push({ lngLat: where, kind: steady ? "ok" : "", label: steady ? `${name} · fuel steady` : name, at: stop.from });
  }
  for (const r of trip.refuels) {
    const flagged = flag?.rule === "R2" && flag.at === r.t;
    const short = flagged || r2Fires(r.billedCl, r.tankRiseCl);
    events.push({
      lngLat: r5(placeById(r.placeId).lngLat),
      kind: short ? "bad" : "fuel",
      label: short ? `${pumpName(r.placeId)} · bill ${L(r.billedCl)} L, tank +${L(r.tankRiseCl)} L` : `${pumpName(r.placeId)} · bill matches`,
      at: r.t,
    });
  }
  let focus: LngLat;
  let tail: string;
  const offPlanM = Math.max(0, ...actual.map((p) => distanceToPathM(p, plan)));
  const follows = offPlanM <= R4.offPathM ? ", which follows the plan" : "";
  if (flag?.rule === "R1") {
    focus = sampleAt(trip, flag.at);
    const place = flag.placeId ? ` near ${placeById(flag.placeId).name.en}` : "";
    const window = trip.samples.slice(Math.max(0, flag.at - trip.start), (flag.until ?? flag.at) - trip.start + 1);
    const how = window.some((s) => !s.ignition) ? "Parked" : "Stopped";
    events.push({ lngLat: focus, kind: "bad", label: `${how}${place} · −${flag.litres ?? 0} L`, at: flag.at });
    const offM = distanceToPathM(focus, plan);
    tail =
      offM > R4.offPathM
        ? `, which leaves the highway for ${km1(offM)} km${place} where fuel dropped`
        : `, which stops${place} where fuel dropped`;
  } else if (flag?.rule === "R2") {
    const bill = [...trip.refuels].sort((a, b) => Math.abs(a.t - flag.at) - Math.abs(b.t - flag.at))[0];
    focus = bill ? r5(placeById(bill.placeId).lngLat) : sampleAt(trip, flag.at);
    tail = `${follows}; the short refuel was at ${bill ? placeById(bill.placeId).name.en : "a pump"}`;
  } else if (flag?.rule === "R3") {
    const stretch = route.stretches[0] as keyof typeof STRETCHES | undefined;
    focus = stretch ? r5(placeById(STRETCHES[stretch].centerPlaceId).lngLat) : midpoint(actual);
    tail = `${follows}; the extra diesel is spread across the whole trip`;
  } else if (flag?.rule === "R4" && lit) {
    focus = midpoint(lit);
    tail = `, which runs ${km1(pathLengthM(lit))} km off the plan`;
  } else {
    focus = midpoint(actual);
    tail = status === "live" ? "" : follows;
  }
  const endAt = status === "live" ? lastT : trip.end;
  events.push({
    lngLat: sampleAt(trip, endAt),
    kind: "end",
    label: status === "live" ? `${time(Math.min(lastT, DEMO_NOW))} · on the road` : `${shortPlace(route.to)} · ${time(trip.end)}`,
    at: endAt,
  });
  events.sort((a, b) => a.at - b.at);

  // ── Bounds and words ──
  const all = [...plan, ...actual];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const bounds: [LngLat, LngLat] = [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
  const planned = local ? `planned local route from ${endName(route.from)}` : `planned NH48 route from ${endName(route.from)} to ${endName(route.to)}`;
  const drawn = status === "live" ? "the route so far" : "the actual route";
  const ariaLabel = `Route map: ${planned}, and ${drawn}${tail}`;

  return { plan, actual, lit, focus, events, bounds, ariaLabel };
}

