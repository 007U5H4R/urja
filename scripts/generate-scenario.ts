/**
 * Generates lib/data/scenario/scenario.json (technical-plan §4.7).
 *
 *   pnpm tsx scripts/generate-scenario.ts [--check]
 *
 * 1. Physical plan: anchored trips first (flag trips, route-normal trips,
 *    27 Sep's 17 and 24 Sep's 17, the 11 on the road at DEMO_NOW), then
 *    filler trips per truck, with a local run closing each truck's km.
 * 2. Physics per trip (scripts/scenario/plan.ts).
 * 3. Injections and resolutions: §4.3 D1–D9 and N1–N14.
 * 4. Commercial balancing (scripts/scenario/balance.ts).
 * 5. Assert every plausibility bound and every anchor by running the real
 *    pipeline on the result (scripts/scenario/verify.ts); only then write.
 *
 * Every choice comes from mulberry32(SCENARIO_SEED). On a failed attempt the
 * same stream moves on to the next attempt, so the output is deterministic.
 * With --check it runs the same attempts and writes nothing: it exits 1 if the
 * result differs from the committed scenario.json.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEMO_NOW } from "@/lib/clock";
import { kmPerLitre, truckByPlate } from "@/lib/data/fleet";
import { distanceToPathM, haversineM, offsetM } from "@/lib/data/geo";
import { BEHROR_PARKING_0926_04, placeById } from "@/lib/data/places";
import { mulberry32, SCENARIO_SEED } from "@/lib/data/prng";
import { isOnStretch, kmAlongRoute, pointAtKm, routeById } from "@/lib/data/routes";
import type { Injection, Resolution, Scenario, ScenarioTrip } from "@/lib/data/scenario/schema";
import { scenarioSchema } from "@/lib/data/scenario/schema";
import { simulateTrip } from "@/lib/data/simulate";
import type { Bilingual } from "@/lib/data/types";
import {
  DAILY_PROFIT, DIESEL_INCIDENTS, HIDDEN_TRUCKS, NON_DIESEL_FLAGS, PLATE, ROUTE_NORMAL_PROFITS, SEPTEMBER, T0917_06, T0926_04,
  T0926_11, T0927_02, VISIBLE_TRUCKS, YESTERDAY,
} from "./anchors";
import { balance, basePerKm, clToInr, dieselCl, tollsInr } from "./scenario/balance";
import { apportion, type Plan, placeKm, type Rng, round50, type StopSpec, uni, pickOne } from "./scenario/plan";
import { type Block, type BlockSpec, FILLER_END_BEFORE, Schedule, SEPT_START, septDay, shuffle, type Slot, type TripSpec } from "./scenario/schedule";
import { verifyScenario } from "./scenario/verify";

const OUT = resolve(__dirname, "../lib/data/scenario/scenario.json");
const HIDDEN = HIDDEN_TRUCKS.map((h) => h.plate);
const ALL = [...VISIBLE_TRUCKS.map((v) => v.plate), ...HIDDEN];
const LIVE_ROUTES = ["JAI-OKH", "JAI-MAN", "JAI-AHM", "JAI-BHW"];

class Fail extends Error {}
const need = <T>(x: T | null | undefined, what: string): T => {
  if (x === null || x === undefined) throw new Fail(what);
  return x;
};

// ── Anchor trip plans ────────────────────────────────────────────────────
function plan0926_04(): Plan {
  const a = T0926_04;
  const route = routeById(a.routeId);
  const kDhaba = placeKm(a.routeId, "shahpura-dhaba");
  const kPark = kmAlongRoute(route, BEHROR_PARKING_0926_04).km;
  const kPump = placeKm(a.routeId, a.refuel.placeId);
  const [p1, p2, p3] = a.plazas;
  const kmOf = (id: string) => route.plazas.find((z) => z.placeId === id)!.atKm;
  const [f1, f2, f3, f4] = a.legFuelL.map((l) => Math.round(l * 100));
  const [f2a, f2b] = apportion(f2, [p1.at - a.dhaba[1], a.parked[0] - p1.at]);
  const [f4a, f4b, f4c] = apportion(f4, [p2.at - a.refuel.stop[1], p3.at - p2.at, 575 - p3.at]);
  const legs = [
    { from: 0, to: a.dhaba[0], km: kDhaba, fuelCl: f1 },
    { from: a.dhaba[1], to: p1.at, km: kmOf(p1.placeId) - kDhaba, fuelCl: f2a },
    { from: p1.at, to: a.parked[0], km: kPark - kmOf(p1.placeId), fuelCl: f2b },
    { from: a.parked[1], to: a.refuel.stop[0], km: kPump - kPark, fuelCl: f3 },
    { from: a.refuel.stop[1], to: p2.at, km: kmOf(p2.placeId) - kPump, fuelCl: f4a },
    { from: p2.at, to: p3.at, km: kmOf(p3.placeId) - kmOf(p2.placeId), fuelCl: f4b },
    { from: p3.at, to: 575, km: route.plannedKm - kmOf(p3.placeId), fuelCl: f4c },
  ];
  return {
    plate: a.plate,
    routeId: a.routeId,
    dur: a.end - a.start,
    actualKm: route.plannedKm,
    legs,
    stops: [
      { from: a.dhaba[0], to: a.dhaba[1], kind: "dhaba", placeId: "shahpura-dhaba" },
      { from: a.parked[0], to: a.parked[1], kind: "parked", lngLat: [...BEHROR_PARKING_0926_04] },
      { from: a.refuel.stop[0], to: a.refuel.stop[1], kind: "refuel", placeId: a.refuel.placeId },
    ],
    refuels: [{ t: a.refuel.billAt, placeId: a.refuel.placeId, billedCl: a.refuel.billedL * 100, tankRiseCl: a.refuel.riseL * 100 }],
    plazas: a.plazas.map((z) => ({ placeId: z.placeId, t: z.at, inr: z.inr })),
    startFuelCl: a.startFuelL * 100,
    fuelUsedCl: f1 + f2 + f3 + f4,
    loadT: a.loadT,
    cargo: a.cargo,
    injections: [{ kind: "stationary-drop", from: a.drop.from, to: a.drop.to, litres: a.drop.litres, lngLat: [...BEHROR_PARKING_0926_04] }],
    tollExtraInr: 0,
  };
}

/** A parked stop near Behror (off the road, clear of pumps) where `litres` go missing. */
function behrorDrop(rng: Rng, routeId: string, litres: number): StopSpec {
  const route = routeById(routeId);
  const bk = placeKm(routeId, "behror");
  for (let k = 0; k < 500; k++) {
    const km = bk + uni(rng, -4, 4);
    const side = uni(rng, 500, 1400) * (rng() < 0.5 ? -1 : 1);
    const p = offsetM(pointAtKm(route, km), side, side * 0.3);
    const off = distanceToPathM(p, route.path);
    const pumpM = Math.min(haversineM(p, placeById("behror-pump").lngLat), haversineM(p, placeById("neemrana-hp").lngLat));
    if (off < 400 || pumpM < 1_500 || !isOnStretch("behror", p)) continue;
    const minutes = Math.round(litres / uni(rng, 1.35, 1.55));
    const offset = Math.round(uni(rng, 4, 7));
    return { km: kmAlongRoute(route, p).km, dur: offset + minutes + Math.round(uni(rng, 6, 12)), kind: "parked", lngLat: p, drop: { offset, minutes, litres } };
  }
  throw new Fail("no Behror parking spot");
}

/** Extra km whose R4 ₹ (to ₹10) equals `inr` for this truck on this route; whole km when possible. */
function detourKm(plate: string, routeId: string, inr: number): number | null {
  const kmpl = kmPerLitre(truckByPlate(plate), routeId);
  const planned = routeById(routeId).plannedKm;
  const rupees = (e: number) => Math.round((e * 90) / kmpl / 10) * 10;
  const lo = Math.ceil(planned * 0.065 * 10) / 10;
  for (let e = Math.ceil(lo); e <= planned * 0.4; e++) if (rupees(e) === inr) return e;
  for (let e10 = Math.ceil(lo * 10); e10 <= planned * 4; e10++) if (rupees(e10 / 10) === inr) return e10 / 10;
  return null;
}

const dropFor = (n: string) => DIESEL_INCIDENTS.find((d) => d.n === n)!;

// ── One attempt ──────────────────────────────────────────────────────────
interface Built {
  scenario: Scenario;
}

function attempt(rng: Rng): Built {
  const sch = new Schedule(rng);
  const visibleKm = new Map(VISIBLE_TRUCKS.map((v) => [v.plate, v.septKm]));
  const roomFor = (plate: string, slots: Slot[]) => {
    const cap = visibleKm.get(plate);
    if (cap === undefined) return true;
    const have = septKmOf(sch.slots().filter((x) => x.plate === plate));
    return have + septKmOf(slots) <= cap - 20;
  };
  // Pool blocks go to the truck with the most km still to find (targets: visible exact, hidden ~6,000).
  const kmStillNeeded = (plate: string) => (visibleKm.get(plate) ?? 6_000) - septKmOf(sch.slots().filter((x) => x.plate === plate));
  const rankByNeed = (plate: string) => -kmStillNeeded(plate) + uni(rng, -150, 150);
  const pin = (spec: BlockSpec) => need(sch.pin(spec, spec.plate ? undefined : roomFor, spec.plate ? undefined : rankByNeed), `could not pin ${spec.name}`);

  // Visible trucks and the two named hidden drivers.
  pin({ name: "D3", plate: PLATE.ramesh, trips: [
    { routeId: "JAI-OKH", role: "flag", anchorId: "0912-05", flagRef: "D3", startDay: 12, endDay: 12, plan: (_p, r) => ({ stops: [behrorDrop(r, "JAI-OKH", 69)] }) },
    { routeId: "OKH-JAI" },
  ] });
  pin({ name: "D7", plate: PLATE.ramesh, terminal: true, trips: [
    { routeId: "JAI-OKH", role: "flag", anchorId: "0926-04", flagRef: "D7", fixedStart: T0926_04.start, fixedPlan: plan0926_04 },
  ] });
  pin({ name: "D1", plate: PLATE.vikram, trips: [
    { routeId: "JAI-OKH", role: "flag", anchorId: "0905-03", flagRef: "D1", startDay: 5, endDay: 5, plan: (_p, r) => ({ stops: [behrorDrop(r, "JAI-OKH", 40)] }) },
    { routeId: "OKH-JAI" },
  ] });
  pin({ name: "D8", plate: PLATE.vikram, terminal: true, trips: [
    { routeId: "JAI-AHM", endDay: 26 },
    {
      routeId: "AHM-JAI", role: "flag", anchorId: "0927-02", flagRef: "D8", fixedStart: T0927_02.start,
      plan: (plate, r) => {
        const burn = Math.round((18_900 * uni(r, 0.985, 1.015)) / 100) * 100;
        const pumpKm = placeKm("AHM-JAI", T0927_02.refuel.placeId);
        const start = Math.round((13_100 + (burn / 662) * pumpKm) / 100) * 100;
        return {
          dur: T0927_02.end - T0927_02.start,
          fuelUsedCl: burn,
          startFuelCl: start,
          autoStops: false,
          stops: [
            { km: uni(r, 200, 240), dur: 45, kind: "dhaba" },
            { km: uni(r, 400, 440), dur: 45, kind: "dhaba" },
            { km: pumpKm, dur: 18, kind: "refuel", placeId: T0927_02.refuel.placeId, atT: T0927_02.refuel.billAt - T0927_02.start - 6, refuel: { riseCl: T0927_02.refuel.riseL * 100, billedCl: T0927_02.refuel.billedL * 100 } },
          ],
        };
      },
    },
  ] });
  pin({ name: "D2", plate: PLATE.anil, trips: [
    { routeId: "JAI-AHM", role: "flag", anchorId: "0909-03", flagRef: "D2", startDay: 9, endDay: 9, plan: () => ({ burnFactor: 1, excessCl: dropFor("D2").litres * 100, loadT: 27 }) },
    { routeId: "AHM-JAI" },
  ] });
  pin({ name: "D4", plate: PLATE.anil, trips: [
    {
      routeId: "JAI-BHW", role: "flag", anchorId: "0917-06", flagRef: "D4", fixedStart: T0917_06.start,
      plan: () => ({
        dur: T0917_06.end - T0917_06.start,
        fuelUsedCl: (325 + dropFor("D4").litres) * 100,
        startFuelCl: 38_000,
        autoStops: false,
        loadT: 22,
        stops: [
          { km: 400, dur: T0917_06.stopMin, kind: "dhaba" },
          { km: placeKm("JAI-BHW", "vadodara-pump"), dur: T0917_06.stopMin, kind: "refuel", placeId: "vadodara-pump" },
        ],
      }),
    },
    { routeId: "BHW-JAI" },
  ] });
  pin({ name: "D9", plate: PLATE.anil, terminal: true, trips: [
    {
      routeId: "JAI-BHW", role: "flag", anchorId: "0926-11", flagRef: "D9", fixedStart: T0926_11.start,
      plan: () => ({
        dur: T0926_11.end - T0926_11.start,
        fuelUsedCl: T0926_11.usedL * 100,
        startFuelCl: 25_000,
        autoStops: false,
        loadT: T0926_11.loadT,
        cargo: { en: "steel coils", hi: "स्टील कॉइल" },
        stops: [
          { km: 211, dur: 40, kind: "dhaba", atT: T0926_11.stops[0][0] },
          { km: placeKm("JAI-BHW", "udaipur-pump"), dur: 40, kind: "refuel", placeId: "udaipur-pump", atT: T0926_11.stops[1][0] },
          { km: placeKm("JAI-BHW", "surat-pump") + 3, dur: 270, kind: "rest", atT: T0926_11.stops[2][0] },
        ],
      }),
    },
  ] });
  pin({ name: "D5", plate: PLATE.sunil, trips: [
    { routeId: "JAI-OKH", role: "rn", endDay: 20 },
    { routeId: "OKH-JAI", role: "flag", anchorId: "0921-09", flagRef: "D5", startDay: 21, endDay: 21, plan: (_p, r) => ({ stops: [behrorDrop(r, "OKH-JAI", 42)] }) },
  ] });
  pin({ name: "D6", plate: PLATE.rajendra, trips: [
    { routeId: "JAI-MAN", role: "flag", anchorId: "0923-02", flagRef: "D6", startDay: 23, endDay: 23, plan: (_p, r) => ({ stops: [behrorDrop(r, "JAI-MAN", 48)] }) },
    { routeId: "MAN-JAI", endDay: 23 },
  ] });

  // Terminal blocks: 27 Sep and the 11 trucks on the road at 7:12 AM.
  const live = (): TripSpec => ({ routeId: pickOne(rng, LIVE_ROUTES), inProgress: true });
  pin({ name: "Mahesh", plate: PLATE.mahesh, terminal: true, trips: [{ routeId: "JAI-AHM" }, { routeId: "AHM-JAI", endDay: 27 }, { routeId: "JAI-AHM", inProgress: true }] });
  pin({ name: "Imran", plate: PLATE.imran, terminal: true, trips: [{ routeId: "JAI-KSG", endDay: 27 }, { routeId: "KSG-JAI", endDay: 27 }, { routeId: "JAI-OKH", inProgress: true }] });
  pin({ name: "Suresh", plate: PLATE.suresh, terminal: true, trips: [{ routeId: "JAI-KSG", endDay: 27 }, { routeId: "KSG-JAI", endDay: 27 }] });
  pin({ name: "Balwant", plate: PLATE.balwant, terminal: true, trips: [{ routeId: "JAI-OKH", role: "rn", endDay: 26 }] });
  pin({ name: "Deepak", plate: PLATE.deepak, terminal: true, trips: [{ routeId: "JAI-BHW", inProgress: true }] });

  const hiddenFree = () => HIDDEN.filter((p) => !sch.byPlate(p).some((b) => b.terminal));
  const b27a = pin({ name: "H27a", pool: hiddenFree(), terminal: true, trips: [{ routeId: "JAI-AHM" }, { routeId: "AHM-JAI", endDay: 27 }, live()] });
  pin({ name: "H27b", pool: hiddenFree(), terminal: true, trips: [{ routeId: "JAI-AHM" }, { routeId: "AHM-JAI", endDay: 27 }, live()] });
  pin({ name: "H27c", pool: hiddenFree(), terminal: true, trips: [{ routeId: "JAI-AHM", endDay: 27 }, { routeId: "AHM-JAI", inProgress: true }] });
  for (let k = 0; k < 3; k++) {
    pin({ name: `K27-${k}`, pool: hiddenFree(), terminal: true, trips: [{ routeId: "JAI-KSG", endDay: 27 }, { routeId: "KSG-JAI", endDay: 27 }, live()] });
  }
  for (let k = 0; k < 2; k++) pin({ name: `Live-${k}`, pool: hiddenFree(), terminal: true, trips: [live()] });

  // Non-diesel flags N1–N14, on long routes where the day allows.
  for (const n of NON_DIESEL_FLAGS) {
    const flagFirst = n.day <= 2 || rng() < 0.5;
    let out: string;
    if (n.rule === "R4") out = n.n === "N14" ? "BHW" : "AHM";
    else out = pickOne(rng, ["AHM", "BHW"]);
    const flagRoute = flagFirst ? `JAI-${out}` : `${out}-JAI`;
    const flagTrip: TripSpec = {
      routeId: flagRoute,
      role: "flag",
      flagRef: n.n,
      endDay: n.day,
      plan: (plate) => (n.rule === "R5" ? { tollExtraInr: n.inr } : { extraKm: need(detourKm(plate, flagRoute, n.inr), `no detour km for ${n.n}`) }),
    };
    const other: TripSpec = { routeId: flagFirst ? `${out}-JAI` : `JAI-${out}` };
    pin({ name: n.n, plate: n.plate ?? undefined, pool: n.plate ? undefined : HIDDEN, trips: flagFirst ? [flagTrip, other] : [other, flagTrip] });
  }

  // 24 Sep's 17 trips, and the route-normal Jaipur → Okhla trips.
  const rn = (endDay: number, back?: number): BlockSpec => ({
    name: `RN${endDay}`,
    pool: HIDDEN,
    trips: [{ routeId: "JAI-OKH", role: "rn", endDay }, { routeId: "OKH-JAI", ...(back ? { endDay: back } : {}) }],
  });
  const pair = (out: string, a?: number, b?: number): BlockSpec => ({
    name: `P${out}`,
    pool: HIDDEN,
    trips: [{ routeId: `JAI-${out}`, ...(a ? { endDay: a } : {}) }, { routeId: `${out}-JAI`, ...(b ? { endDay: b } : {}) }],
  });
  const longLeg = (out: string) => (rng() < 0.5 ? pair(out, 24) : pair(out, undefined, 24));
  const day24: BlockSpec[] = [rn(23, 24), rn(23, 24), rn(24)];
  for (let k = 0; k < 14; k++) day24.push(longLeg(k < 7 ? "BHW" : "AHM"));
  for (const blk of day24) pin(blk);
  for (const d of [13, 14, 15, 17, 18, 19, 22, 25]) pin(rn(d));

  // August filler (before the counted month).
  for (const plate of ALL) {
    const specs: TripSpec[][] = [];
    // About the September pace (~8 departures a day) for the three pre-roll days.
    const nAug = rng() < 0.45 ? 1 : 0;
    for (let k = 0; k < nAug; k++) specs.push(randomPair(rng));
    for (let k = specs.length; k > 0 && !sch.fill(plate, specs.slice(0, k), Math.round(uni(rng, 0, 600)), SEPT_START - 1); k--) {
      /* try fewer */
    }
  }

  // September filler. Visible trucks: pairs that bring their km to within
  // 20–150 of the target, closed by a local run. Hidden trucks share what is
  // left of the 212-trip budget and stay within 5,650–7,250 km.
  const perKmTarget = new Map<string, number>([...VISIBLE_TRUCKS.map((v) => [v.plate, v.perKm] as const), ...HIDDEN_TRUCKS.map((h) => [h.plate, h.perKm] as const)]);
  const septSlots = (plate: string) => sch.slots().filter((x) => x.plate === plate && isSeptSlot(x));
  const plans = new Map<string, TripSpec[][]>();
  for (const v of VISIBLE_TRUCKS) {
    const rem = Math.round((v.septKm - septKmOf(septSlots(v.plate))) * 10) / 10;
    const combo = need(pickCombo(rng, rem - 150, rem - 20, null), `${v.plate}: no filler for ${rem} km`);
    const specs = comboSpecs(combo);
    const local = Math.round((rem - comboKm(combo)) * 10) / 10;
    specs.push([{ routeId: `JAI-LOC-${local}`, kmBalancer: true }]);
    plans.set(v.plate, specs);
  }
  let budget = SEPTEMBER.trips - countSeptSlots(sch.slots()) - [...plans.values()].reduce((a, sp) => a + sp.flat().length, 0);
  if (process.env.GEN_DEBUG) {
    const pinnedKm = septKmOf(sch.slots());
    console.log(`pins: ${countSeptSlots(sch.slots())} trips, ${pinnedKm.toFixed(0)} km; visible filler ${[...plans.values()].reduce((a, sp) => a + sp.flat().length, 0)} trips; hidden budget ${budget}; hidden pinned km ${HIDDEN.map((h) => septKmOf(septSlots(h)).toFixed(0)).join(",")}`);
  }
  if (budget < 0) throw new Fail(`trip budget ${budget}`);
  const hiddenPinned = new Map<string, number>(HIDDEN.map((h) => [h, septKmOf(septSlots(h))]));
  const extraLocal = budget % 2 === 1 ? pickOne(rng, HIDDEN) : null;
  if (extraLocal) budget -= 1;
  const HID_LO = 5_620;
  const HID_HI = 7_280;
  const baseKm = (h: string) => hiddenPinned.get(h)! + (h === extraLocal ? 60 : 0);
  const nRange = (h: string): [number, number] => {
    let lo = -1;
    let hi = -1;
    for (let n = 0; n <= 9; n++) {
      if (pickCombo(() => 0.5, HID_LO - baseKm(h), HID_HI - baseKm(h), n)) {
        if (lo < 0) lo = n;
        hi = n;
      }
    }
    return [lo, hi];
  };
  const ranges = new Map(HIDDEN.map((h) => [h, nRange(h)]));
  const hiddenPairs = new Map<string, number>(HIDDEN.map((h) => [h, Math.max(0, ranges.get(h)![0])]));
  if (HIDDEN.some((h) => ranges.get(h)![0] < 0)) throw new Fail("a hidden truck cannot reach its km range");
  let left = budget / 2 - [...hiddenPairs.values()].reduce((a, b) => a + b, 0);
  if (left < 0) throw new Fail(`hidden trucks need ${budget / 2 - left} pairs, budget ${budget / 2}`);
  for (; left > 0; left--) {
    const open = HIDDEN.filter((h) => hiddenPairs.get(h)! < ranges.get(h)![1]);
    if (open.length === 0) throw new Fail("hidden trucks cannot take every pair");
    const h = open.sort((x, y) => baseKm(x) + 1800 * hiddenPairs.get(x)! - (baseKm(y) + 1800 * hiddenPairs.get(y)!) || x.localeCompare(y))[0];
    hiddenPairs.set(h, hiddenPairs.get(h)! + 1);
  }
  for (const h of HIDDEN) {
    const combo = need(pickCombo(rng, HID_LO - baseKm(h), HID_HI - baseKm(h), hiddenPairs.get(h)!, true), `${h}: no ${hiddenPairs.get(h)}-pair filler`);
    const specs = comboSpecs(combo);
    if (h === extraLocal) specs.push([{ routeId: "JAI-LOC-60" }]);
    plans.set(h, specs);
  }
  for (const plate of shuffle(rng, [...ALL])) {
    // One pair ends by 13 Sep: the truck balancer (§4.7 4c) needs a clean trip there.
    const specs = shuffle(rng, [...plans.get(plate)!]);
    const firstPair = specs.findIndex((b) => b.length === 2);
    if (firstPair >= 0) specs[firstPair] = specs[firstPair].map((t, i) => (i === 1 ? { ...t, endByDay: 13 } : t));
    let ok = false;
    for (let tries = 0; tries < 12 && !ok; tries++) ok = sch.fill(plate, specs, SEPT_START, FILLER_END_BEFORE - 1);
    if (!ok) throw new Fail(`${plate}: filler does not fit`);
  }
  if (countSeptSlots(sch.slots()) !== SEPTEMBER.trips) throw new Fail(`trip count ${countSeptSlots(sch.slots())}`);

  // Trip-ID floors (0926-11 needs ≥ 11 departures on 26 Sep, …) and a day
  // balancer for every day 14–26: met by re-timing filler blocks, never by adding trips.
  const floors: Record<number, number> = { 5: 3, 9: 3, 12: 5, 17: 6, 21: 9, 23: 2, 26: 11, 27: 2 };
  const hasBalancer = (day: number) =>
    sch.slots().some((x) => septDay(x.start + x.plan.dur) === day && HIDDEN.includes(x.plate) && x.role === "free" && !x.kmBalancer && !x.inProgress);
  const invariantsHold = (fixed: number[], fixedBal: number[]) =>
    fixed.every((d) => startsOn(sch, d) >= floors[d]) && fixedBal.every(hasBalancer);
  const doneFloors: number[] = [];
  const doneBal: number[] = [];
  for (const [d, n] of Object.entries(floors)) {
    const day = Number(d);
    for (let guard = 0; guard < 60 && startsOn(sch, day) < n; guard++) {
      retime(rng, sch, ALL, { startDay: day }, () => invariantsHold(doneFloors, doneBal));
    }
    if (startsOn(sch, day) < n) throw new Fail(`only ${startsOn(sch, day)} departures on ${day} Sep`);
    doneFloors.push(day);
  }
  for (let day = 14; day <= 26; day++) {
    for (let guard = 0; guard < 30 && !hasBalancer(day); guard++) {
      retime(rng, sch, HIDDEN, { endDay: day }, () => invariantsHold(doneFloors, doneBal));
    }
    if (!hasBalancer(day)) throw new Fail(`no day balancer for ${day} Sep`);
    doneBal.push(day);
  }

  // Each day 14–26 needs enough freight to reach its profit at plausible rates:
  // move filler blocks between days until every day's required rate is within ±30%.
  const movable = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26];
  const cost = (x: Slot) => clToInr(dieselCl(x)) + tollsInr(x) + round50(150 + 2.6 * x.plan.actualKm) + 250 + 0.6 * x.plan.actualKm;
  const dayRatio = (d: number) => {
    const list = sch.slots().filter((x) => isSeptSlot(x) && septDay(x.start + x.plan.dur) === d);
    let target = DAILY_PROFIT[d];
    let free = 0;
    let freeCost = 0;
    for (const x of list) {
      if (x.role === "rn") target -= 16_600;
      else if (x.anchorId === T0926_04.id) target -= T0926_04.profitInr;
      else {
        free += basePerKm(x.plan.routeId) * x.plan.actualKm * (perKmTarget.get(x.plate)! / 21);
        freeCost += cost(x);
      }
    }
    return free > 0 ? (target + freeCost) / free : 9;
  };
  const spread = () => Math.max(...movable.map((d) => Math.abs(Math.log(dayRatio(d)))));
  for (let guard = 0; guard < 120; guard++) {
    const worst = movable.map((d) => ({ d, r: dayRatio(d) })).sort((a, b) => Math.abs(Math.log(b.r)) - Math.abs(Math.log(a.r)))[0];
    if (Math.abs(Math.log(worst.r)) < Math.log(1.28)) break;
    const before = spread();
    const keep = () => invariantsHold(doneFloors, doneBal) && spread() < before - 1e-9;
    if (worst.r > 1) {
      // Needs more freight: bring a block in from the day with the most to spare.
      const donors = movable.filter((d) => d !== worst.d).sort((a, b) => dayRatio(a) - dayRatio(b)).slice(0, 4);
      retime(rng, sch, ALL, { endDay: worst.d }, keep, (b) => donors.includes(septDay(b.end)));
    } else {
      const takers = movable.filter((d) => d !== worst.d).sort((a, b) => dayRatio(b) - dayRatio(a)).slice(0, 3);
      for (const t of takers) if (retime(rng, sch, ALL, { endDay: t }, keep, (b) => septDay(b.end) === worst.d)) break;
    }
  }
  if (process.env.GEN_DEBUG) console.log(`day ratios: ${movable.map((d) => `${d}:${dayRatio(d).toFixed(2)}`).join(" ")}`);

  const slots = sch.slots();
  assignIds(slots);
  const hiddenSet = new Set(HIDDEN);
  const b27 = b27a.slots[1];
  const res = balance(rng, slots, hiddenSet, {
    perKm: perKmTarget,
    dayProfit: DAILY_PROFIT,
    routeNormalProfits: ROUTE_NORMAL_PROFITS,
    day27: { freightInr: YESTERDAY.freightInr, dieselInr: YESTERDAY.dieselInr, tollsInr: YESTERDAY.tollsInr, allowanceOtherInr: YESTERDAY.allowanceOtherInr },
    fixed: new Map([[T0926_04.id, { freightInr: T0926_04.freightInr, allowanceInr: T0926_04.allowanceInr, otherInr: T0926_04.otherInr }]]),
  }, b27);
  if (res.errors.length) throw new Fail(`balance: ${res.errors.slice(0, 6).join("; ")}${res.errors.length > 6 ? ` (+${res.errors.length - 6})` : ""}`);

  const scenario = assemble(slots);
  return { scenario };
}

const isSeptSlot = (s: Slot) => !s.inProgress && septDay(s.start + s.plan.dur) >= 1 && septDay(s.start + s.plan.dur) <= 27;

function septKmOf(slots: Slot[]): number {
  return slots.filter(isSeptSlot).reduce((a, s) => a + s.plan.actualKm, 0);
}

function countSeptSlots(slots: Slot[]): number {
  return slots.filter(isSeptSlot).length;
}

function randomPair(rng: Rng): TripSpec[] {
  const out = pickOne(rng, ["OKH", "MAN", "AHM", "KSG"]);
  return [{ routeId: `JAI-${out}` }, { routeId: `${out}-JAI` }];
}

/** Out-and-back pairs the filler draws from: [destination, km, most per truck]. */
const PAIRS: [string, number, number][] = [
  ["BHW", 2300, 4],
  ["AHM", 1324, 5],
  ["MAN", 460, 2],
  ["OKH", 572, 1],
  ["KSG", 210, 2],
];
type Combo = number[];
const comboKm = (c: Combo) => c.reduce((a, n, i) => a + n * PAIRS[i][1], 0);
const comboPairs = (c: Combo) => c.reduce((a, n) => a + n, 0);

/**
 * A random multiset of pairs whose km lands in [lo, hi]: with exactly
 * `pairs` pairs, or (pairs = null) with as few pairs as possible.
 */
function pickCombo(rng: Rng, lo: number, hi: number, pairs: number | null, lean = false): Combo | null {
  const all: Combo[] = [];
  const rec = (i: number, cur: number[]) => {
    if (i === PAIRS.length) {
      const km = comboKm(cur);
      if (km >= lo && km <= hi && (pairs === null || comboPairs(cur) === pairs)) all.push([...cur]);
      return;
    }
    for (let n = 0; n <= PAIRS[i][2]; n++) rec(i + 1, [...cur, n]);
  };
  rec(0, []);
  if (all.length === 0) return null;
  const min = Math.min(...all.map(comboPairs));
  let best = pairs === null ? all.filter((c) => comboPairs(c) === min) : all;
  if (lean) {
    // Hidden trucks: stay near the bottom of their range, so the km go where they are needed.
    const least = Math.min(...best.map(comboKm));
    best = best.filter((c) => comboKm(c) <= least + 700);
  }
  // Prefer realistic mixes: fewer Kishangarh and Okhla shuttles.
  const w = best.map((c) => 1 / (1 + 3 * (c[4] + c[3] + c[2])));
  let x = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < best.length; i++) if ((x -= w[i]) < 0) return best[i];
  return best[best.length - 1];
}

function comboSpecs(c: Combo): TripSpec[][] {
  const out: TripSpec[][] = [];
  c.forEach((n, i) => {
    for (let k = 0; k < n; k++) out.push([{ routeId: `JAI-${PAIRS[i][0]}` }, { routeId: `${PAIRS[i][0]}-JAI` }]);
  });
  return out;
}

function startsOn(sch: Schedule, day: number): number {
  return sch.slots().filter((s) => septDay(s.start) === day).length;
}

/**
 * Moves one September filler block (same routes, re-planned) so one of its
 * trips starts or ends on the given day. Keeps the move only if `keep()`.
 */
function retime(
  rng: Rng,
  sch: Schedule,
  plates: readonly string[],
  c: { startDay?: number; endDay?: number },
  keep: () => boolean,
  filter: (b: Block) => boolean = () => true,
): boolean {
  const cands = shuffle(
    rng,
    sch.blocks.filter((b) => b.filler && b.specs && plates.includes(b.plate) && septDay(b.start) >= 1 && !b.specs.some((t) => t.kmBalancer) && filter(b)),
  );
  for (const b of cands) {
    for (let leg = 0; leg < b.specs!.length; leg++) {
      const specs = b.specs!.map((t, i) => (i === leg ? { ...t, ...c } : { ...t }));
      sch.remove(b);
      if (sch.fill(b.plate, [specs], SEPT_START, FILLER_END_BEFORE - 1, 8)) {
        if (keep()) {
          // The new block keeps its original, unconstrained specs for later moves.
          const nb = sch.blocks[sch.blocks.length - 1];
          nb.specs = b.specs;
          return true;
        }
        sch.remove(sch.blocks[sch.blocks.length - 1]);
      }
      sch.blocks.push(b);
    }
  }
  return false;
}

/** 'MMDD-NN' by start date; anchored ids keep their numbers, the rest fill in by departure. */
function assignIds(slots: Slot[]): void {
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const k = mmdd(s.start);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  for (const [k, list] of byDay) {
    const taken = new Set<number>();
    for (const s of list) {
      if (!s.anchorId) continue;
      if (s.anchorId.slice(0, 4) !== k) throw new Fail(`${s.anchorId} starts on ${k}`);
      const n = Number(s.anchorId.slice(5));
      if (n > list.length) throw new Fail(`${s.anchorId}: only ${list.length} departures that day`);
      taken.add(n);
      s.id = s.anchorId;
    }
    let n = 1;
    for (const s of [...list].sort((a, b) => a.start - b.start || a.plate.localeCompare(b.plate))) {
      if (s.anchorId) continue;
      while (taken.has(n)) n++;
      s.id = `${k}-${String(n).padStart(2, "0")}`;
      n++;
    }
  }
}

function mmdd(t: number): string {
  const d = septDay(t);
  if (d >= 1 && d <= 30) return `09${String(d).padStart(2, "0")}`;
  // August 29–31.
  const aug = 29 + Math.floor(t / 1440);
  return `08${aug}`;
}

// ── Assembly ─────────────────────────────────────────────────────────────
const YARD_LABEL: Record<string, Bilingual> = {
  "jaipur-tn": { en: "Jaipur yard", hi: "जयपुर यार्ड" },
  okhla: { en: "Okhla, Delhi", hi: "ओखला, दिल्ली" },
  bhiwandi: { en: "Bhiwandi", hi: "भिवंडी" },
  ahmedabad: { en: "Ahmedabad", hi: "अहमदाबाद" },
  manesar: { en: "Manesar", hi: "मानेसर" },
  kishangarh: { en: "Kishangarh", hi: "किशनगढ़" },
};
const TOWARDS: Record<string, Bilingual> = {
  "jaipur-tn": { en: "To Jaipur", hi: "जयपुर की ओर" },
  okhla: { en: "To Delhi", hi: "दिल्ली की ओर" },
  bhiwandi: { en: "To Mumbai", hi: "मुंबई की ओर" },
  ahmedabad: { en: "To Ahmedabad", hi: "अहमदाबाद की ओर" },
  manesar: { en: "To Manesar", hi: "मानेसर की ओर" },
  kishangarh: { en: "To Kishangarh", hi: "किशनगढ़ की ओर" },
};
const WORKSHOP: Bilingual = { en: "Jaipur workshop", hi: "जयपुर वर्कशॉप" };

const r3 = (x: number) => Math.round(x * 1000) / 1000;

function toTrip(s: Slot): ScenarioTrip {
  const p = s.plan;
  const at = (t: number) => s.start + t;
  const kms = p.legs.map((l) => r3(l.km));
  kms[kms.length - 1] = r3(p.actualKm - kms.slice(0, -1).reduce((a, b) => a + b, 0));
  const injections: Injection[] = p.injections.map((j) => (j.kind === "stationary-drop" ? { ...j, from: at(j.from), to: at(j.to) } : j));
  const inc = DIESEL_INCIDENTS.find((d) => d.n === s.flagRef);
  const nd = NON_DIESEL_FLAGS.find((d) => d.n === s.flagRef);
  if (inc?.rule === "R2") {
    const i = p.refuels.findIndex((r) => r.billedCl - r.tankRiseCl > 1000);
    injections.push({ kind: "refuel-short", refuelIndex: i, missingCl: p.refuels[i].billedCl - p.refuels[i].tankRiseCl });
  }
  if (inc?.rule === "R3") injections.push({ kind: "excess", litres: inc.litres });
  if (nd?.rule === "R4") injections.push({ kind: "detour", km: p.extraKm! });
  if (nd?.rule === "R5") injections.push({ kind: "toll-claim", inr: nd.inr });
  const plazas = p.plazas.map((z) => ({ placeId: z.placeId, t: at(z.t), inr: z.inr }));
  const trip: ScenarioTrip = {
    id: s.id,
    plate: s.plate,
    routeId: p.routeId,
    start: s.start,
    end: s.start + p.dur,
    loadT: p.loadT,
    cargo: p.cargo,
    freightInr: s.freightInr,
    allowanceInr: s.allowanceInr,
    otherInr: s.otherInr,
    startFuelCl: p.startFuelCl,
    fuelUsedCl: p.fuelUsedCl,
    legs: p.legs.map((l, i) => ({ from: at(l.from), to: at(l.to), km: kms[i], fuelCl: l.fuelCl })),
    stops: p.stops.map((st) => ({ ...st, from: at(st.from), to: at(st.to) })),
    refuels: p.refuels.map((r) => ({ t: at(r.t), placeId: r.placeId, billedCl: r.billedCl, tankRiseCl: r.tankRiseCl })),
    tolls: { claimedInr: plazas.reduce((a, z) => a + z.inr, 0) + p.tollExtraInr, plazas },
    injections,
  };
  if (p.extraKm) {
    trip.extraKm = p.extraKm;
    trip.detour = p.detour;
  }
  return trip;
}

function assemble(slots: Slot[]): Scenario {
  const trips = slots.map(toTrip).sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const resolutions: Resolution[] = [];
  for (const d of DIESEL_INCIDENTS) {
    resolutions.push({ flagId: `${d.tripId}-${d.rule}`, status: d.status, driverSide: d.driverSide, recoveredInr: d.recoveredInr });
  }
  for (const n of NON_DIESEL_FLAGS) {
    const s = slots.find((x) => x.flagRef === n.n)!;
    resolutions.push({ flagId: `${s.id}-${n.rule}`, status: n.status, driverSide: n.driverSide, recoveredInr: n.recoveredInr });
  }
  // Where every truck is at 7:12 AM.
  const plates = [...VISIBLE_TRUCKS.map((v) => v.plate), ...HIDDEN_TRUCKS.map((h) => h.plate)];
  const lastEnd = new Map<string, ScenarioTrip>();
  const liveTrip = new Map<string, ScenarioTrip>();
  for (const t of trips) {
    if (t.start <= DEMO_NOW && t.end > DEMO_NOW) liveTrip.set(t.plate, t);
    else if (t.end <= DEMO_NOW && (!lastEnd.has(t.plate) || lastEnd.get(t.plate)!.end < t.end)) lastEnd.set(t.plate, t);
  }
  // The workshop truck: the hidden truck off the road longest.
  const idle = HIDDEN_TRUCKS.map((h) => h.plate).filter((p) => !liveTrip.has(p) && routeById(lastEnd.get(p)!.routeId).to === "jaipur-tn");
  const workshop = idle.sort((a, b) => lastEnd.get(a)!.end - lastEnd.get(b)!.end)[0];
  const nowTrucks = plates.map((plate) => {
    const lt = liveTrip.get(plate);
    if (lt) {
      const sim = simulateTrip(lt, { until: DEMO_NOW });
      return { plate, state: "moving" as const, label: TOWARDS[routeById(lt.routeId).to], lngLat: sim.samples[sim.samples.length - 1].lngLat };
    }
    const to = routeById(lastEnd.get(plate)!.routeId).to;
    if (plate === workshop) return { plate, state: "workshop" as const, label: WORKSHOP, lngLat: [...placeById(to).lngLat] as [number, number] };
    return { plate, state: "yard" as const, label: YARD_LABEL[to], lngLat: [...placeById(to).lngLat] as [number, number] };
  });
  return scenarioSchema.parse({ version: 1, seed: SCENARIO_SEED, trips, resolutions, now: { at: DEMO_NOW, trucks: nowTrucks } });
}

// ── Output ───────────────────────────────────────────────────────────────
export function serialise(s: Scenario): string {
  const line = (x: unknown) => JSON.stringify(x);
  return [
    "{",
    `  "version": ${s.version},`,
    `  "seed": ${s.seed},`,
    `  "trips": [`,
    s.trips.map((t) => `    ${line(t)}`).join(",\n"),
    "  ],",
    `  "resolutions": [`,
    s.resolutions.map((r) => `    ${line(r)}`).join(",\n"),
    "  ],",
    `  "now": {`,
    `    "at": ${s.now.at},`,
    `    "trucks": [`,
    s.now.trucks.map((t) => `      ${line(t)}`).join(",\n"),
    "    ]",
    "  }",
    "}",
    "",
  ].join("\n");
}

function main(): void {
  const check = process.argv.includes("--check");
  const rng = mulberry32(SCENARIO_SEED);
  const t0 = performance.now();
  for (let n = 1; n <= 200; n++) {
    let built: Built;
    try {
      built = attempt(rng);
    } catch (e) {
      if (!(e instanceof Fail)) throw e;
      console.log(`attempt ${n}: ${e.message}`);
      continue;
    }
    const problems = verifyScenario(built.scenario);
    if (problems.length > 0) {
      console.log(`attempt ${n}: ${problems.length} check(s) failed:\n  ${problems.slice(0, 25).join("\n  ")}`);
      continue;
    }
    const text = serialise(built.scenario);
    console.log(`attempt ${n}: all checks pass · ${built.scenario.trips.length} trips · ${(text.length / 1024).toFixed(0)} KB · ${((performance.now() - t0) / 1000).toFixed(1)} s`);
    if (check) {
      const committed = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
      if (committed !== text) {
        console.error(`--check: ${OUT} differs from what the generator produces; run it without --check.`);
        process.exit(1);
      }
      console.log("--check: the committed scenario.json is exactly what the generator produces.");
      return;
    }
    writeFileSync(OUT, text);
    return;
  }
  console.error("No attempt passed every check; nothing written.");
  process.exit(1);
}

// Run only when executed directly (`pnpm tsx scripts/generate-scenario.ts`), not when imported.
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) main();
