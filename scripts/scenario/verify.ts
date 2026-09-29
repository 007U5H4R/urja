/**
 * Step 5 of §4.7: run the real pipeline on a candidate scenario and check
 * every §4.3 anchor and every plausibility bound (TC-001..TC-013).
 * Returns the list of problems; an empty list means the scenario may be written.
 */
import { DEMO_NOW, dayKey } from "@/lib/clock";
import { TANK_CL } from "@/lib/data/constants";
import { kmPerLitre, truckByPlate } from "@/lib/data/fleet";
import { buildDataset } from "@/lib/data/pipeline";
import { isLocalRoute, routeById } from "@/lib/data/routes";
import type { Scenario } from "@/lib/data/scenario/schema";
import type { Flag, Trip } from "@/lib/data/types";
import {
  ANIL, CLEAN_DAYS_TO_24, CUMULATIVE_L, DAILY_PROFIT, DIESEL_INCIDENTS, HIDDEN_KM_RANGE, HIDDEN_PER_KM_OPEN, HIDDEN_TRUCKS,
  LAST7, LIVE_TRIPS, NO_FLAG_PLATES, NON_DIESEL_FLAGS, NOW_COUNTS, ROUTE_NORMAL_INR, ROUTE_NORMAL_PROFITS, SEPTEMBER,
  T0917_06, T0926_04, T0926_11, T0927_02, VISIBLE_TRUCKS, WEEKS, YESTERDAY,
} from "../anchors";
import { basePerKm, FREIGHT_BAND, OTHER_RANGE, TOLL_TARIFF_RANGE } from "./balance";
import { SEP } from "./schedule";

const day = (t: Trip) => dayKey(t.end);
const septDayOf = (k: string) => (k >= "2026-09-01" && k <= "2026-09-27" ? Number(k.slice(8)) : 0);
const round1 = (x: number) => Math.round(x * 10) / 10;

export function verifyScenario(sc: Scenario): string[] {
  const bad: string[] = [];
  const expect = (ok: boolean, msg: string) => {
    if (!ok) bad.push(msg);
  };
  const eq = (got: unknown, want: unknown, what: string) => expect(JSON.stringify(got) === JSON.stringify(want), `${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

  const ds = buildDataset(sc);
  const sept = ds.trips.filter((t) => septDayOf(day(t)) > 0);
  const septIds = new Set(sept.map((t) => t.id));
  const flags = ds.flags.filter((f) => septIds.has(f.tripId));
  const L = ds.ledgers;
  const byId = new Map(ds.trips.map((t) => [t.id, t]));

  // ── Counts and now ─────────────────────────────────────────────────────
  eq(sept.length, SEPTEMBER.trips, "trips ending 1–27 Sep");
  eq(ds.live.length, LIVE_TRIPS, "trips on the road at 7:12 AM");
  expect(ds.trips.every((t) => t.end < SEP(28) || t.end > DEMO_NOW), "a trip ends on 28 Sep before 7:12 AM");
  const states = { moving: 0, yard: 0, workshop: 0 };
  for (const n of sc.now.trucks) states[n.state]++;
  eq(states, NOW_COUNTS, "now states");
  for (const v of VISIBLE_TRUCKS) {
    const n = sc.now.trucks.find((x) => x.plate === v.plate);
    eq(n && { state: n.state, label: n.label }, v.now, `now · ${v.plate}`);
  }
  const livePlates = new Set(ds.live.map((t) => t.plate));
  expect(sc.now.trucks.every((n) => (n.state === "moving") === livePlates.has(n.plate)), "moving trucks ≠ trucks with a live trip");
  expect(HIDDEN_TRUCKS.some((h) => sc.now.trucks.find((n) => n.plate === h.plate)?.state === "workshop"), "workshop truck is not rank 6–21");

  // ── Yesterday ──────────────────────────────────────────────────────────
  const y = sept.filter((t) => day(t) === YESTERDAY.dayKey);
  const sum = (ts: Trip[], f: (id: string) => number) => ts.reduce((a, t) => a + f(t.id), 0);
  eq(
    [y.length, sum(y, (i) => L[i].freightInr), sum(y, (i) => L[i].dieselInr), sum(y, (i) => L[i].tollsInr), sum(y, (i) => L[i].allowanceInr + L[i].otherInr), sum(y, (i) => L[i].profitInr)],
    [YESTERDAY.trips, YESTERDAY.freightInr, YESTERDAY.dieselInr, YESTERDAY.tollsInr, YESTERDAY.allowanceOtherInr, YESTERDAY.profitInr],
    "yesterday [trips, freight, diesel, tolls, allowance+other, profit]",
  );
  eq(y.filter((t) => routeById(t.routeId).stretches.includes("udaipur")).length, YESTERDAY.udaipurTrips, "yesterday's Udaipur-stretch trips");
  eq([sum(y, (i) => L[i].unaccountedInr), sum(y, (i) => L[i].unaccountedCl) / 100], [YESTERDAY.unaccountedInr, YESTERDAY.unaccountedL], "yesterday unaccounted [₹, L]");
  const yFlags = flags.filter((f) => f.dayKey === YESTERDAY.dayKey).map((f) => [f.tripId, f.rule, f.litres, f.inr, f.confidence]);
  eq(yFlags.sort(), [["0926-04", "R1", 38, 3420, "high"], ["0926-11", "R3", 39, 3510, "check"], ["0927-02", "R2", 50, 4500, "likely"]], "yesterday's flags");

  // ── Flags vs injections, one to one (TC-011) ───────────────────────────
  const injected: string[] = [];
  for (const s of sc.trips) {
    if (!septIds.has(s.id)) {
      expect(s.injections.length === 0, `${s.id}: injection outside September`);
      continue;
    }
    const truck = s.plate;
    for (const j of s.injections) {
      if (j.kind === "stationary-drop") injected.push(`${s.id} R1 ${j.litres}`);
      if (j.kind === "refuel-short") injected.push(`${s.id} R2 ${j.missingCl / 100}`);
      if (j.kind === "excess") injected.push(`${s.id} R3 ${j.litres}`);
      if (j.kind === "detour") {
        const kmpl = kmPerLitre(truckByPlate(truck), s.routeId);
        injected.push(`${s.id} R4 ${Math.round((j.km * 90) / kmpl / 10) * 10}`);
      }
      if (j.kind === "toll-claim") injected.push(`${s.id} R5 ${j.inr}`);
    }
  }
  const detected = flags.map((f) => `${f.tripId} ${f.rule} ${f.rule === "R4" || f.rule === "R5" ? f.inr : f.litres}`);
  eq([...detected].sort(), [...injected].sort(), "detected flags vs injections");
  eq(flags.length, SEPTEMBER.flags, "September flags");
  expect(ds.flags.length === flags.length, "flags outside September");

  for (const d of DIESEL_INCIDENTS) {
    const f = flagOf(flags, d.tripId, d.rule);
    const t = byId.get(d.tripId);
    eq(
      f && t && [t.plate, septDayOf(f.dayKey), f.litres, f.inr, f.status, f.recoveredInr, f.driverSide.state, f.driverSide.text?.en ?? null],
      [d.plate, d.day, d.litres, d.inr, d.status, d.recoveredInr, d.driverSide.state, d.driverSide.text?.en ?? null],
      `${d.n} ${d.tripId}`,
    );
  }
  for (const n of NON_DIESEL_FLAGS) {
    const f = flags.filter((x) => x.rule === n.rule && septDayOf(x.dayKey) === n.day && x.inr === n.inr);
    expect(f.length === 1, `${n.n}: ${f.length} matching flags`);
    if (f.length !== 1) continue;
    eq([f[0].status, f[0].recoveredInr, f[0].driverSide.state], [n.status, n.recoveredInr, n.driverSide.state], `${n.n} resolution`);
    if (n.plate) eq(f[0].plate, n.plate, `${n.n} plate`);
    else expect(HIDDEN_TRUCKS.some((h) => h.plate === f[0].plate), `${n.n} is not on a rank 6–21 truck`);
  }
  for (const p of NO_FLAG_PLATES) expect(!flags.some((f) => f.plate === p), `${p} has a flag`);
  eq(flags.filter((f) => f.plate === "RJ14 GB 1450").map((f) => f.rule), ["R5"], "Imran's flags");
  eq(flags.filter((f) => f.plate === "RJ14 GA 6618").map((f) => f.rule), ["R4"], "Deepak's flags");
  const count = (s: Flag["status"]) => flags.filter((f) => f.status === s).length;
  eq([count("confirmed"), count("waiting"), count("wrong")], [SEPTEMBER.confirmed, SEPTEMBER.waiting, SEPTEMBER.wrong], "confirmed/waiting/wrong");
  eq([flags.reduce((a, f) => a + f.inr, 0), flags.reduce((a, f) => a + f.recoveredInr, 0)], [SEPTEMBER.flaggedInr, SEPTEMBER.recoveredInr], "flagged/recovered");
  for (const w of WEEKS) {
    const inW = flags.filter((f) => septDayOf(f.dayKey) >= w.days[0] && septDayOf(f.dayKey) <= w.days[1]);
    eq([inW.reduce((a, f) => a + f.inr, 0), inW.reduce((a, f) => a + f.recoveredInr, 0)], [w.flaggedInr, w.recoveredInr], `week ${w.days.join("–")}`);
  }
  const diesel = flags.filter((f) => f.rule !== "R4" && f.rule !== "R5");
  eq([diesel.length, diesel.reduce((a, f) => a + f.litres!, 0), diesel.reduce((a, f) => a + f.inr, 0)], [9, SEPTEMBER.dieselL, SEPTEMBER.dieselInr], "diesel incidents");
  const cum: number[] = [];
  let acc = 0;
  for (let d = 1; d <= 27; d++) {
    acc += diesel.filter((f) => septDayOf(f.dayKey) === d).reduce((a, f) => a + f.litres!, 0);
    cum.push(acc);
  }
  eq(cum, CUMULATIVE_L, "cumulative litres");
  const behror = diesel.filter((f) => f.placeId === "behror");
  eq([behror.map((f) => f.tripId).sort(), behror.reduce((a, f) => a + f.litres!, 0)], [[...SEPTEMBER.behror.tripIds].sort(), SEPTEMBER.behror.litres], "Behror stretch");
  const anil = diesel.filter((f) => f.plate === "RJ14 GC 3309");
  eq([anil.reduce((a, f) => a + f.litres!, 0), anil.reduce((a, f) => a + f.inr, 0), anil.map((f) => f.tripId).sort()], [ANIL.litres, ANIL.inr, [...ANIL.tripIds].sort()], "Anil");
  const last7 = diesel.filter((f) => septDayOf(f.dayKey) >= 21);
  eq([last7.reduce((a, f) => a + f.litres!, 0), last7.reduce((a, f) => a + f.inr, 0), last7.map((f) => f.tripId).sort()], [LAST7.litres, LAST7.inr, [...LAST7.tripIds].sort()], "last 7 days");

  // ── Trucks ─────────────────────────────────────────────────────────────
  const truckStats = (plate: string) => {
    const ts = sept.filter((t) => t.plate === plate);
    const km = ts.reduce((a, t) => a + t.actualKm, 0);
    const profit = ts.reduce((a, t) => a + L[t.id].profitInr, 0);
    const unacc = flags.filter((f) => f.plate === plate && f.status !== "wrong").reduce((a, f) => a + f.inr, 0);
    return { km, perKm: round1(profit / km), unacc };
  };
  for (const v of VISIBLE_TRUCKS) {
    const s = truckStats(v.plate);
    expect(Math.abs(s.km - v.septKm) < 0.01, `${v.plate} km ${s.km}, want ${v.septKm}`);
    eq([s.perKm, s.unacc], [v.perKm, v.unaccountedInr], `${v.plate} [₹/km, unaccounted]`);
  }
  for (const h of HIDDEN_TRUCKS) {
    const s = truckStats(h.plate);
    expect(s.km >= HIDDEN_KM_RANGE[0] && s.km <= HIDDEN_KM_RANGE[1], `${h.plate} km ${s.km.toFixed(1)} outside ${HIDDEN_KM_RANGE}`);
    eq(s.perKm, h.perKm, `${h.plate} ₹/km`);
    expect(s.perKm > HIDDEN_PER_KM_OPEN[0] && s.perKm < HIDDEN_PER_KM_OPEN[1], `${h.plate} ₹/km not strictly inside`);
  }

  // ── Days ───────────────────────────────────────────────────────────────
  for (const [d, p] of Object.entries(DAILY_PROFIT)) {
    const ts = sept.filter((t) => septDayOf(day(t)) === Number(d));
    eq(ts.reduce((a, t) => a + L[t.id].profitInr, 0), p, `profit ${d} Sep`);
  }
  const d24 = sept.filter((t) => septDayOf(day(t)) === 24);
  eq([d24.length, flags.filter((f) => septDayOf(f.dayKey) === 24).length], [17, 0], "24 Sep [trips, flags]");
  const clean: number[] = [];
  for (let d = 1; d <= 24; d++) if (!flags.some((f) => septDayOf(f.dayKey) === d)) clean.push(d);
  eq(clean, CLEAN_DAYS_TO_24, "clean days 1–24");

  // ── Route normal of 0926-04 ────────────────────────────────────────────
  const t04 = byId.get("0926-04");
  const rn = ds.trips
    .filter((t) => t.routeId === "JAI-OKH" && t.end >= SEP(13) && t04 && t.end < t04.end)
    .sort((a, b) => a.end - b.end);
  eq(rn.map((t) => L[t.id].profitInr), ROUTE_NORMAL_PROFITS, "route-normal profits");
  expect(rn.every((t) => !flags.some((f) => f.tripId === t.id)), "a route-normal trip is flagged");
  eq(Math.round(rn.reduce((a, t) => a + L[t.id].profitInr, 0) / rn.length), ROUTE_NORMAL_INR, "route normal");

  // ── Trip anchors ───────────────────────────────────────────────────────
  if (t04) {
    const l = L[t04.id];
    eq(
      [t04.start, t04.end, l.freightInr, l.dieselCl, l.dieselInr, l.unaccountedCl, l.unaccountedInr, l.tollsInr, l.allowanceInr, l.otherInr, l.profitInr],
      [T0926_04.start, T0926_04.end, 28_000, 11_800, 10_620, 3_800, 3_420, 2_140, 1_200, 800, 13_240],
      "0926-04 ledger",
    );
    for (const [dt, want] of Object.entries(T0926_04.fuelAt)) {
      const s = t04.samples[Number(dt)];
      expect(Math.abs(s.fuelCl / 100 - want) <= 1.8, `0926-04 fuel at t${dt}: ${s.fuelCl / 100} vs ${want}`);
    }
    const f = flagOf(flags, "0926-04", "R1");
    eq(f && [f.at, f.until, f.evidence.map((e) => e.text.en)], [T0926_04.at, T0926_04.until, [...T0926_04.evidence]], "0926-04 flag");
    expect(!!f && /±2 L/.test(f.whyConfidence.en) && /19×/.test(f.whyConfidence.en), "0926-04 whyConfidence");
    const moving = t04.samples.filter((s) => s.speedKmh > 0);
    const avg = moving.reduce((a, s) => a + s.speedKmh, 0) / moving.length;
    expect(Math.abs(avg - 36) < 1.5, `0926-04 moving speed ${avg.toFixed(1)} km/h`);
  } else bad.push("0926-04 missing");
  const t02 = byId.get("0927-02");
  const f2 = flagOf(flags, "0927-02", "R2");
  eq(t02 && f2 && [t02.plate, t02.routeId, t02.start, t02.end, f2.at, f2.placeId], [T0927_02.plate, T0927_02.routeId, T0927_02.start, T0927_02.end, T0927_02.refuel.billAt, T0927_02.refuel.placeId], "0927-02");
  const t11 = byId.get("0926-11");
  eq(t11 && [t11.plate, t11.routeId, t11.start, t11.end, t11.loadT, t11.tank.startCl + t11.refuels.reduce((a, r) => a + r.tankRiseCl, 0) - t11.tank.endCl], [T0926_11.plate, T0926_11.routeId, T0926_11.start, T0926_11.end, T0926_11.loadT, T0926_11.usedL * 100], "0926-11");
  const t0917 = byId.get("0917-06");
  eq(t0917 && [dayKey(t0917.start), dayKey(t0917.end), t0917.start, t0917.end], ["2026-09-17", "2026-09-17", T0917_06.start, T0917_06.end], "0917-06");

  // ── Plausibility (TC-013) ──────────────────────────────────────────────
  for (const t of ds.trips) {
    const km = t.samples.reduce((a, s, i) => (i < t.samples.length - 1 ? a + s.speedKmh / 60 : a), 0);
    expect(Math.abs(km - t.actualKm) <= 0.02 * t.actualKm, `${t.id}: ∫speed ${km.toFixed(1)} vs ${t.actualKm}`);
    expect(t.samples.every((s) => s.fuelCl >= 0 && s.fuelCl <= TANK_CL), `${t.id}: fuel outside 0–400 L`);
    for (const e of t.fastag) expect(e.inr >= TOLL_TARIFF_RANGE[0] && e.inr <= TOLL_TARIFF_RANGE[1], `${t.id}: toll ₹${e.inr}`);
    if (isLocalRoute(t.routeId)) expect(t.actualKm >= 20 && t.actualKm <= 150, `${t.id}: local run ${t.actualKm} km`);
    expect(t.claims.otherInr >= OTHER_RANGE[0] && t.claims.otherInr <= OTHER_RANGE[1], `${t.id}: other ₹${t.claims.otherInr}`);
    const perKm = t.freightInr / t.actualKm;
    const base = basePerKm(t.routeId);
    expect(perKm >= base * FREIGHT_BAND[0] && perKm <= base * FREIGHT_BAND[1], `${t.id}: freight ₹${perKm.toFixed(1)}/km`);
  }
  const byPlate = new Map<string, { start: number; end: number; id: string }[]>();
  for (const s of sc.trips) {
    if (!byPlate.has(s.plate)) byPlate.set(s.plate, []);
    byPlate.get(s.plate)!.push(s);
  }
  for (const [plate, list] of byPlate) {
    list.sort((a, b) => a.start - b.start);
    for (let i = 1; i < list.length; i++) expect(list[i].start > list[i - 1].end, `${plate}: ${list[i - 1].id} overlaps ${list[i].id}`);
  }
  // Whole litres everywhere except 27 Sep's balancer trip (§4.9 #4, TP2).
  const fractional = sc.trips.filter((t) => t.fuelUsedCl % 100 !== 0 || t.startFuelCl % 100 !== 0 || t.refuels.some((r) => r.tankRiseCl % 100 !== 0 || r.billedCl % 100 !== 0));
  expect(fractional.length <= 1 && fractional.every((t) => dayKey(t.end) === YESTERDAY.dayKey && t.injections.length === 0), `fractional litres on ${fractional.map((t) => t.id).join(", ")}`);
  const ids = sc.trips.map((t) => t.id);
  expect(new Set(ids).size === ids.length, "duplicate trip ids");
  return bad;
}

function flagOf(flags: Flag[], tripId: string, rule: string): Flag | undefined {
  return flags.find((f) => f.tripId === tripId && f.rule === rule);
}
