/**
 * Trip planner for the scenario generator (§4.7 step 2): lays out one trip's
 * physics relative to its departure (t = 0): stops, moving legs, diesel,
 * refuels at route pumps whenever the tank falls below 35%, and plaza times.
 */
import { REFUEL_BELOW_CL, TANK_CL } from "@/lib/data/constants";
import { baselineClFor, truckByPlate } from "@/lib/data/fleet";
import { placeById } from "@/lib/data/places";
import { isLocalRoute, kmAlongRoute, routeById } from "@/lib/data/routes";
import type { Injection, ScenarioLeg, ScenarioRefuel, ScenarioStop } from "@/lib/data/scenario/schema";
import type { Bilingual, LngLat } from "@/lib/data/types";

export type Rng = () => number;
export const uni = (rng: Rng, a: number, b: number) => a + (b - a) * rng();
export const pickOne = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
export const round50 = (x: number) => Math.round(x / 50) * 50;
export const round10 = (x: number) => Math.round(x / 10) * 10;

/** Minimum tank at any point of a trip (the planner raises the start fuel to keep it). */
const MIN_TANK_CL = 4_000;
export const REFUEL_STOP_MIN = 18;
/** The bill is printed this many minutes into a refuel stop. */
export const BILL_OFFSET_MIN = 6;

export interface StopSpec {
  km: number;
  dur: number;
  kind: "dhaba" | "rest" | "refuel" | "parked";
  placeId?: string;
  lngLat?: LngLat;
  /** Arrival time pinned (minutes after departure). */
  atT?: number;
  /** For a refuel: a given rise and bill; otherwise the planner fills the tank. */
  refuel?: { riseCl: number; billedCl: number };
  /** For a parked stop: fuel falls by `litres` from `offset` minutes into the stop, over `minutes`. */
  drop?: { offset: number; minutes: number; litres: number };
}

export interface PlanInput {
  plate: string;
  routeId: string;
  /** Fixed total duration (minutes). */
  dur?: number;
  speedKmh?: number;
  /** Exact burn; else baseline × actual/planned × burnFactor (+ excessCl). */
  fuelUsedCl?: number;
  burnFactor?: number;
  excessCl?: number;
  extraKm?: number;
  startFuelCl?: number;
  stops?: StopSpec[];
  autoStops?: boolean;
  loadT?: number;
  cargo?: Bilingual;
  tollExtraInr?: number;
}

export interface Plan {
  plate: string;
  routeId: string;
  dur: number;
  actualKm: number;
  legs: ScenarioLeg[];
  stops: ScenarioStop[];
  refuels: ScenarioRefuel[];
  plazas: { placeId: string; t: number; inr: number }[];
  startFuelCl: number;
  fuelUsedCl: number;
  loadT: number;
  cargo: Bilingual;
  extraKm?: number;
  detour?: { fromKm: number; toKm: number };
  injections: Injection[];
  tollExtraInr: number;
}

const CARGO_OUT: Bilingual[] = [
  { en: "cement", hi: "सीमेंट" },
  { en: "marble slabs", hi: "मार्बल स्लैब" },
  { en: "textiles", hi: "कपड़ा" },
  { en: "steel pipes", hi: "स्टील पाइप" },
  { en: "ceramic tiles", hi: "सिरेमिक टाइल" },
  { en: "FMCG cartons", hi: "एफएमसीजी कार्टन" },
];
const CARGO_BACK: Bilingual[] = [
  { en: "auto parts", hi: "ऑटो पार्ट्स" },
  { en: "machinery", hi: "मशीनरी" },
  { en: "chemicals", hi: "केमिकल" },
  { en: "paper rolls", hi: "पेपर रोल" },
  { en: "cotton bales", hi: "कपास की गाँठें" },
];

export function defaultCargo(rng: Rng, routeId: string): Bilingual {
  return pickOne(rng, routeId.startsWith("JAI-") ? CARGO_OUT : CARGO_BACK);
}

export function defaultLoad(rng: Rng, plate: string, routeId: string): number {
  const usual = truckByPlate(plate).usualLoadT[routeId] ?? 12;
  return Math.max(6, usual - Math.floor(rng() * 4));
}

export function defaultSpeed(rng: Rng, routeId: string): number {
  if (isLocalRoute(routeId)) return uni(rng, 24, 34);
  if (routeId.includes("KSG")) return uni(rng, 44, 50);
  return uni(rng, 47, 54);
}

/** Route km of a place along the route. */
export function placeKm(routeId: string, placeId: string): number {
  return kmAlongRoute(routeById(routeId), placeById(placeId).lngLat).km;
}

/** Distributes `total` integer units over weights (largest remainder); every share ≥ `min`. */
export function apportion(total: number, weights: number[], min = 0): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const base = weights.map((w) => Math.max(min, Math.floor((total * w) / sum)));
  let rest = total - base.reduce((a, b) => a + b, 0);
  const order = weights
    .map((w, i) => ({ i, r: (total * w) / sum - Math.floor((total * w) / sum) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  let k = 0;
  while (rest > 0) {
    base[order[k % order.length].i]++;
    rest--;
    k++;
  }
  k = 0;
  while (rest < 0) {
    const i = order[order.length - 1 - (k % order.length)].i;
    if (base[i] > min) {
      base[i]--;
      rest++;
    }
    k++;
    if (k > 10 * weights.length + 1000) throw new Error("apportion: cannot honour the minimum");
  }
  return base;
}

export function planTrip(rng: Rng, p: PlanInput): Plan {
  const route = routeById(p.routeId);
  const planned = route.plannedKm;
  const extra = p.extraKm ?? 0;
  const actual = planned + extra;
  const truck = truckByPlate(p.plate);

  // Detour region (route km), away from plazas and pumps.
  let detour: { fromKm: number; toKm: number } | undefined;
  if (extra > 0) {
    const len = Math.min(120, Math.max(20, extra * 0.6));
    const marks = [...route.plazas.map((z) => z.atKm), ...route.pumps.map((id) => placeKm(route.id, id))];
    for (let tries = 0; tries < 200 && !detour; tries++) {
      const a = Math.round(uni(rng, 0.2, 0.7) * planned);
      if (a + len < planned - 10 && marks.every((m) => m < a - 3 || m > a + len + 3)) detour = { fromKm: a, toKm: a + len };
    }
    if (!detour) throw new Error(`planTrip: no room for a ${extra} km detour on ${route.id}`);
  }
  const toActual = (k: number) => {
    if (!detour) return k;
    const len = detour.toKm - detour.fromKm;
    if (k <= detour.fromKm) return k;
    if (k >= detour.toKm) return k + extra;
    return detour.fromKm + ((k - detour.fromKm) * (len + extra)) / len;
  };

  const burn =
    p.fuelUsedCl ??
    // Whole litres (§4.9 #4, TP2): only 27 Sep's balancer is set to fractional litres later.
    Math.round((baselineClFor(truck, route.id) * (actual / planned) * (p.burnFactor ?? uni(rng, 0.975, 1.025))) / 100) * 100 +
    (p.excessCl ?? 0);
  const rate = burn / actual;

  // ── Refuels along the distance ─────────────────────────────────────────
  const given = (p.stops ?? []).map((s) => ({ ...s }));
  const pumps = route.pumps
    .map((id) => ({ id, km: toActual(placeKm(route.id, id)) }))
    .filter((x) => x.km > 3 && x.km < actual - 5)
    .sort((a, b) => a.km - b.km);

  let startFuel = p.startFuelCl ?? Math.round(uni(rng, 220, 360)) * 100;
  let stops: StopSpec[] = [];
  for (let attempt = 0; ; attempt++) {
    if (attempt > 40) throw new Error(`planTrip: cannot keep the tank above ${MIN_TANK_CL / 100} L on ${route.id}`);
    stops = given.map((s) => ({ ...s, refuel: s.refuel ? { ...s.refuel } : undefined }));
    let ok = true;
    let tank = startFuel;
    let km = 0;
    const fills = new Map<StopSpec, number>();
    for (;;) {
      const events = stops
        .filter((s) => s.km > km + 1e-9 && ((s.kind === "refuel") || s.drop))
        .sort((a, b) => a.km - b.km);
      const next = events[0];
      const horizon = next ? next.km : actual;
      // Does the tank cross 35% before the next event?
      const crossKm = km + (tank - REFUEL_BELOW_CL) / rate;
      if (tank > REFUEL_BELOW_CL && crossKm < horizon) {
        const pump = pumps.find((x) => x.km >= crossKm - 1e-9);
        if (pump && pump.km < horizon - 1e-9) {
          const existing = stops.find((s) => s.kind === "refuel" && Math.abs(s.km - pump.km) < 1);
          if (!existing) {
            stops.push({ km: pump.km, dur: REFUEL_STOP_MIN, kind: "refuel", placeId: pump.id });
            continue;
          }
        }
      }
      const tankAtHorizon = tank - (horizon - km) * rate;
      if (Math.min(tank, tankAtHorizon) < MIN_TANK_CL) {
        ok = false;
        break;
      }
      tank = tankAtHorizon;
      km = horizon;
      if (!next) break;
      if (next.drop) tank -= next.drop.litres * 100;
      if (next.kind === "refuel") {
        if (!next.refuel) {
          const fill = Math.round(uni(rng, 330, 385)) * 100;
          const rise = Math.round((fill - tank) / 100) * 100;
          next.refuel = { riseCl: rise, billedCl: rise + 100 * Math.floor(rng() * 3) };
        }
        fills.set(next, tank);
        tank += next.refuel.riseCl;
      }
      if (tank < MIN_TANK_CL || tank > TANK_CL) {
        ok = false;
        break;
      }
    }
    if (ok) break;
    if (p.startFuelCl !== undefined && attempt > 0) throw new Error(`planTrip: the given start fuel does not work on ${route.id}`);
    startFuel = Math.min(39_000, startFuel + 2_000);
  }

  // ── Dhaba and rest stops ───────────────────────────────────────────────
  if (p.autoStops ?? true) {
    if (!isLocalRoute(route.id) && actual > 150) {
      let last = 0;
      for (;;) {
        const k = last + uni(rng, 170, 240);
        if (k > actual - 40) break;
        const near = stops.find((s) => Math.abs(s.km - k) < 45);
        if (near) {
          last = Math.max(last + 20, near.km);
          continue;
        }
        stops.push({ km: k, dur: Math.round(uni(rng, 30, 50)), kind: "dhaba" });
        last = k;
      }
      if (actual > 700 && !stops.some((s) => s.kind === "rest")) {
        const target = actual * uni(rng, 0.5, 0.62);
        const dhabas = stops.filter((s) => s.kind === "dhaba");
        const d = dhabas.sort((a, b) => Math.abs(a.km - target) - Math.abs(b.km - target))[0];
        if (d) {
          d.kind = "rest";
          d.dur = Math.round(uni(rng, 240, 300));
        }
      }
    }
  }
  stops.sort((a, b) => a.km - b.km);

  // ── Timing: uniform pace between pinned points ─────────────────────────
  const v = p.speedKmh ?? defaultSpeed(rng, route.id);
  const legKm: number[] = [];
  let prevKm = 0;
  for (const s of stops) {
    legKm.push(s.km - prevKm);
    prevKm = s.km;
  }
  legKm.push(actual - prevKm);
  if (legKm.some((k) => k <= 0)) throw new Error(`planTrip: two stops at the same km on ${route.id}`);

  // Pins: indices into the leg list where the arrival time is fixed.
  const legMin: number[] = new Array(legKm.length).fill(0);
  const pins: { leg: number; arrive: number }[] = [];
  stops.forEach((s, i) => {
    if (s.atT !== undefined) pins.push({ leg: i, arrive: s.atT });
  });
  if (p.dur !== undefined) pins.push({ leg: legKm.length - 1, arrive: p.dur });
  let segStartLeg = 0;
  let segDepart = 0;
  for (const pin of pins) {
    const legs = [];
    for (let i = segStartLeg; i <= pin.leg; i++) legs.push(i);
    // Unpinned stops inside this segment are those between its legs.
    const innerStops = stops.slice(segStartLeg, pin.leg).reduce((a, s) => a + s.dur, 0);
    const moving = pin.arrive - segDepart - innerStops;
    const share = apportion(moving, legs.map((i) => legKm[i]), 1);
    legs.forEach((i, k) => (legMin[i] = share[k]));
    segStartLeg = pin.leg + 1;
    segDepart = pin.arrive + (pin.leg < stops.length ? stops[pin.leg].dur : 0);
  }
  for (let i = segStartLeg; i < legKm.length; i++) legMin[i] = Math.max(1, Math.round((legKm[i] / v) * 60));

  const legFuel = apportion(burn, legKm);
  const legs: ScenarioLeg[] = [];
  const outStops: ScenarioStop[] = [];
  const refuels: ScenarioRefuel[] = [];
  const injections: Injection[] = [];
  let t = 0;
  for (let i = 0; i < legKm.length; i++) {
    legs.push({ from: t, to: t + legMin[i], km: legKm[i], fuelCl: legFuel[i] });
    t += legMin[i];
    const s = stops[i];
    if (!s) break;
    const stop: ScenarioStop = { from: t, to: t + s.dur, kind: s.kind };
    if (s.placeId) stop.placeId = s.placeId;
    if (s.lngLat) stop.lngLat = s.lngLat;
    outStops.push(stop);
    if (s.kind === "refuel" && s.refuel) {
      refuels.push({ t: t + BILL_OFFSET_MIN, placeId: s.placeId!, billedCl: s.refuel.billedCl, tankRiseCl: s.refuel.riseCl });
    }
    if (s.drop && s.lngLat) {
      injections.push({ kind: "stationary-drop", from: t + s.drop.offset, to: t + s.drop.offset + s.drop.minutes, litres: s.drop.litres, lngLat: s.lngLat });
    }
    t += s.dur;
  }
  if (p.dur !== undefined && t !== p.dur) throw new Error(`planTrip: timing came to ${t}, not ${p.dur}`);

  // Plaza crossings: interpolate within the leg that covers the plaza's km.
  const plazas = route.plazas.map((z) => {
    const k = toActual(z.atKm);
    let cum = 0;
    for (const leg of legs) {
      if (k <= cum + leg.km + 1e-9) {
        const f = (k - cum) / leg.km;
        return { placeId: z.placeId, t: Math.round(leg.from + f * (leg.to - leg.from)), inr: z.tariffInr };
      }
      cum += leg.km;
    }
    return { placeId: z.placeId, t: legs[legs.length - 1].to, inr: z.tariffInr };
  });

  return {
    plate: p.plate,
    routeId: route.id,
    dur: t,
    actualKm: actual,
    legs,
    stops: outStops,
    refuels,
    plazas,
    startFuelCl: startFuel,
    fuelUsedCl: burn,
    loadT: p.loadT ?? defaultLoad(rng, p.plate, route.id),
    cargo: p.cargo ?? defaultCargo(rng, route.id),
    ...(extra > 0 ? { extraKm: extra, detour } : {}),
    injections,
    tollExtraInr: p.tollExtraInr ?? 0,
  };
}

/** Re-spreads a new burn over the legs (∝ km); refuels stay as they are. */
export function setBurn(plan: Plan, burnCl: number): void {
  const fuel = apportion(burnCl, plan.legs.map((l) => l.km));
  plan.legs.forEach((l, i) => (l.fuelCl = fuel[i]));
  plan.fuelUsedCl = burnCl;
}

/** Noise-free tank at the end of the trip. */
export function endTankCl(plan: Plan): number {
  const drops = plan.injections.reduce((a, j) => a + (j.kind === "stationary-drop" ? j.litres * 100 : 0), 0);
  return plan.startFuelCl - plan.fuelUsedCl + plan.refuels.reduce((a, r) => a + r.tankRiseCl, 0) - drops;
}

/** Lowest and highest noise-free tank level over the trip (checked at every leg end and refuel). */
export function tankRange(plan: Plan): [number, number] {
  let tank = plan.startFuelCl;
  let lo = tank;
  let hi = tank;
  const events: { t: number; d: number }[] = [];
  for (const l of plan.legs) events.push({ t: l.to, d: -l.fuelCl });
  for (const r of plan.refuels) events.push({ t: r.t + 7, d: r.tankRiseCl });
  for (const j of plan.injections) if (j.kind === "stationary-drop") events.push({ t: j.to, d: -j.litres * 100 });
  events.sort((a, b) => a.t - b.t || a.d - b.d);
  for (const e of events) {
    tank += e.d;
    lo = Math.min(lo, tank);
    hi = Math.max(hi, tank);
  }
  return [lo, hi];
}
