/**
 * Commercial balancing (§4.7 step 4): freight, allowance and "other" per trip,
 * so that every money anchor comes out exact.
 *
 * (a) Anchors take their exact values (0926-04; the 13 route-normal trips'
 *     profits).
 * (b) Day balancer: one clean, non-anchor trip on a rank 6–21 truck per day
 *     14–27 closes that day's profit. On 27 Sep it also closes diesel (its
 *     burn, in centilitres), tolls (its last plaza's tariff) and freight.
 * (c) Truck balancer: one clean trip per truck that ended 1–13 Sep closes
 *     round(profit / km, 1) to the truck's ₹/km (its km was closed by a
 *     local run when the plan was drawn).
 * Before (b) and (c), freights are fitted by iterative proportional fitting
 * (a truck factor × a day factor), so the balancers only absorb rounding.
 */
import { DIESEL_INR_PER_L } from "@/lib/data/constants";
import { baselineClFor, truckByPlate } from "@/lib/data/fleet";
import { isLocalRoute } from "@/lib/data/routes";
import { endTankCl, setBurn, tankRange, type Rng, round10, round50, uni } from "./plan";
import { septDay, type Slot } from "./schedule";

export const BASE_FREIGHT_PER_KM: Record<string, number> = {
  "JAI-OKH": 92, "OKH-JAI": 62, "JAI-MAN": 90, "MAN-JAI": 60, "JAI-AHM": 70,
  "AHM-JAI": 58, "JAI-BHW": 64, "BHW-JAI": 52, "JAI-KSG": 88, "KSG-JAI": 72,
};
const LOCAL_FREIGHT_PER_KM = 120;
export const FREIGHT_BAND: [number, number] = [0.55, 1.6];
export const OTHER_RANGE: [number, number] = [200, 4000];
export const TOLL_TARIFF_RANGE: [number, number] = [100, 1500];

export const basePerKm = (routeId: string) => (isLocalRoute(routeId) ? LOCAL_FREIGHT_PER_KM : BASE_FREIGHT_PER_KM[routeId]);

export const clToInr = (cl: number) => Math.round((cl * DIESEL_INR_PER_L) / 100);

/** The diesel the ledger will charge: burn + injected drops + short-filled litres. */
export function dieselCl(s: Slot): number {
  let cl = s.plan.fuelUsedCl;
  for (const j of s.plan.injections) if (j.kind === "stationary-drop") cl += j.litres * 100;
  for (const r of s.plan.refuels) if (r.billedCl - r.tankRiseCl > 1000) cl += r.billedCl - r.tankRiseCl;
  return cl;
}
export const tollsInr = (s: Slot) => s.plan.plazas.reduce((a, p) => a + p.inr, 0);
export const costInr = (s: Slot) => clToInr(dieselCl(s)) + tollsInr(s) + s.allowanceInr + s.otherInr;
export const profitInr = (s: Slot) => s.freightInr - costInr(s);

export interface BalanceTargets {
  perKm: Map<string, number>;
  dayProfit: Record<number, number>;
  routeNormalProfits: number[];
  day27: { freightInr: number; dieselInr: number; tollsInr: number; allowanceOtherInr: number };
  fixed: Map<string, { freightInr: number; allowanceInr: number; otherInr: number }>;
}

export interface BalanceResult {
  errors: string[];
  dayBalancers: Map<number, Slot>;
  truckBalancers: Map<string, Slot>;
}

const isSept = (s: Slot) => !s.inProgress && septDay(s.start + s.plan.dur) >= 1 && septDay(s.start + s.plan.dur) <= 27;
const dayOf = (s: Slot) => septDay(s.start + s.plan.dur);
const isFree = (s: Slot) => s.role === "free";

export function balance(rng: Rng, slots: Slot[], hidden: Set<string>, t: BalanceTargets, balancer27: Slot): BalanceResult {
  const errors: string[] = [];
  const sept = slots.filter(isSept);

  // Allowance and "other" for every trip.
  for (const s of slots) {
    const fx = s.anchorId ? t.fixed.get(s.anchorId) : undefined;
    if (fx) {
      s.freightInr = fx.freightInr;
      s.allowanceInr = fx.allowanceInr;
      s.otherInr = fx.otherInr;
      continue;
    }
    const km = s.plan.actualKm;
    s.allowanceInr = Math.max(200, round50(150 + 2.6 * km));
    s.otherInr = Math.min(3000, Math.max(OTHER_RANGE[0], round10(uni(rng, 0.85, 1.15) * (250 + 0.6 * km))));
  }

  // ── 27 Sep closures: diesel, tolls, allowance + other ──────────────────
  const d27 = sept.filter((s) => dayOf(s) === 27);
  const b = balancer27;
  const adjustable = d27.filter((s) => s !== b && isFree(s));
  const baselineOf = (s: Slot) => baselineClFor(truckByPlate(s.plate), s.plan.routeId) * (s.plan.actualKm / (s.plan.actualKm - (s.plan.extraKm ?? 0)));
  for (let iter = 0; iter < 6; iter++) {
    const others = d27.filter((s) => s !== b).reduce((a, s) => a + clToInr(dieselCl(s)), 0);
    const bInr = t.day27.dieselInr - others;
    let bCl = Math.round((bInr * 100) / DIESEL_INR_PER_L);
    while (clToInr(bCl) < bInr) bCl++;
    while (clToInr(bCl) > bInr) bCl--;
    const base = baselineOf(b);
    const ratio = bCl / base;
    if (ratio >= 0.985 && ratio <= 1.015) {
      setBurn(b.plan, bCl);
      break;
    }
    // Move the others' burn (within ±2.5% of their own baseline) to bring the balancer home.
    const want = bCl - base;
    const room = adjustable.reduce((a, s) => a + baselineOf(s), 0);
    for (const s of adjustable) {
      const bs = baselineOf(s);
      // Whole litres: only the balancer carries fractional litres (§4.9 #4, TP2).
      const next = Math.round(Math.min(bs * 1.025, Math.max(bs * 0.975, s.plan.fuelUsedCl + (want * bs) / room)) / 100) * 100;
      setBurn(s.plan, next);
    }
    if (iter === 5) errors.push(`27 Sep diesel: balancer burn ${bCl} cL is ${(ratio * 100).toFixed(1)}% of its baseline`);
  }
  for (const s of d27) {
    const [lo, hi] = tankRange(s.plan);
    if (lo < 2000 || hi > 40_000 || endTankCl(s.plan) < 2000) errors.push(`27 Sep ${s.key}: tank out of range after the diesel closure`);
  }
  const lastPlaza = b.plan.plazas[b.plan.plazas.length - 1];
  const tollOthers = d27.reduce((a, s) => a + tollsInr(s), 0) - lastPlaza.inr;
  lastPlaza.inr = t.day27.tollsInr - tollOthers;
  if (lastPlaza.inr < TOLL_TARIFF_RANGE[0] || lastPlaza.inr > TOLL_TARIFF_RANGE[1]) errors.push(`27 Sep toll balancer tariff ₹${lastPlaza.inr} out of range`);
  for (let iter = 0; iter < 8; iter++) {
    const others = d27.filter((s) => s !== b).reduce((a, s) => a + s.allowanceInr + s.otherInr, 0);
    const bo = t.day27.allowanceOtherInr - others - b.allowanceInr;
    if (bo >= 600 && bo <= 3000) {
      b.otherInr = bo;
      break;
    }
    const delta = bo < 600 ? 1200 - bo : 2000 - bo; // how much the others must give (+) or take (−)
    const adj = adjustable.filter((s) => s.otherInr > 250 && s.otherInr < 3900);
    for (const s of adj) s.otherInr = Math.min(OTHER_RANGE[1], Math.max(OTHER_RANGE[0], round10(s.otherInr - delta / adj.length)));
    if (iter === 7) errors.push(`27 Sep other: balancer other ₹${bo} out of range`);
  }

  // ── Route-normal trips: exact profits, oldest first ────────────────────
  const rn = sept.filter((s) => s.role === "rn").sort((a, c) => a.start + a.plan.dur - (c.start + c.plan.dur));
  if (rn.length !== t.routeNormalProfits.length) errors.push(`route normal: ${rn.length} trips, want ${t.routeNormalProfits.length}`);
  rn.forEach((s, i) => {
    const p = t.routeNormalProfits[i] ?? 0;
    const base = p + clToInr(dieselCl(s)) + tollsInr(s) + s.allowanceInr + s.otherInr;
    s.freightInr = Math.ceil(base / 100) * 100;
    s.otherInr += s.freightInr - base;
  });

  // ── Fit freights: truck factor × day factor ────────────────────────────
  const scaled = slots.filter((s) => isFree(s) || s.role === "flag").filter((s) => !(s.anchorId && t.fixed.has(s.anchorId)));
  const nominal = new Map(scaled.map((s) => [s, basePerKm(s.plan.routeId) * s.plan.actualKm]));
  const fT = new Map<string, number>();
  const fD = new Map<number, number>();
  const factor = (s: Slot) =>
    isSept(s) ? (fT.get(s.plate) ?? 1) * (fD.get(dayOf(s)) ?? 1) : Math.min(1.2, Math.max(0.85, fT.get(s.plate) ?? 1));
  const freightOf = (s: Slot) => (nominal.has(s) ? nominal.get(s)! * factor(s) : s.freightInr);
  const profitRaw = (s: Slot) => freightOf(s) - costInr(s);
  const truckTarget = new Map<string, number>();
  const kmOf = new Map<string, number>();
  for (const s of sept) kmOf.set(s.plate, (kmOf.get(s.plate) ?? 0) + s.plan.actualKm);
  for (const [plate, km] of kmOf) truckTarget.set(plate, Math.round((t.perKm.get(plate) ?? 0) * km));
  for (let it = 0; it < 400; it++) {
    for (const [d, target] of Object.entries(t.dayProfit)) {
      const day = Number(d);
      const list = sept.filter((s) => dayOf(s) === day);
      const free = list.filter((s) => nominal.has(s));
      const freeF = free.reduce((a, s) => a + freightOf(s), 0);
      const fixedP = list.filter((s) => !nominal.has(s)).reduce((a, s) => a + profitRaw(s), 0);
      const need = target - fixedP + free.reduce((a, s) => a + costInr(s), 0);
      if (freeF > 0) fD.set(day, (fD.get(day) ?? 1) * (need / freeF));
    }
    for (const [plate, target] of truckTarget) {
      const list = sept.filter((s) => s.plate === plate);
      const free = list.filter((s) => nominal.has(s));
      const freeF = free.reduce((a, s) => a + freightOf(s), 0);
      const fixedP = list.filter((s) => !nominal.has(s)).reduce((a, s) => a + profitRaw(s), 0);
      const need = target - fixedP + free.reduce((a, s) => a + costInr(s), 0);
      if (freeF > 0) fT.set(plate, (fT.get(plate) ?? 1) * (need / freeF));
    }
  }
  for (const s of scaled) s.freightInr = Math.round(freightOf(s) / 100) * 100;

  // ── (b) Day balancers ──────────────────────────────────────────────────
  const dayBalancers = new Map<number, Slot>();
  const dayProfitNow = (day: number) => sept.filter((s) => dayOf(s) === day).reduce((a, s) => a + profitInr(s), 0);
  for (const [d, target] of Object.entries(t.dayProfit)) {
    const day = Number(d);
    if (day === 27) continue;
    const cands = sept
      .filter((s) => dayOf(s) === day && hidden.has(s.plate) && isFree(s) && !s.kmBalancer)
      .sort((a, c) => c.plan.actualKm - a.plan.actualKm);
    const s = cands[0];
    if (!s) {
      errors.push(`day ${day}: no day-balancer trip`);
      continue;
    }
    dayBalancers.set(day, s);
    const need = target - dayProfitNow(day);
    let dF = Math.round(need / 500) * 500;
    let other = s.otherInr + dF - need;
    while (other < OTHER_RANGE[0] + 100) {
      dF += 500;
      other += 500;
    }
    while (other > OTHER_RANGE[1] - 100) {
      dF -= 500;
      other -= 500;
    }
    s.freightInr += dF;
    s.otherInr = other;
  }
  // 27 Sep: freight closes on the balancer; its profit follows.
  dayBalancers.set(27, b);
  b.freightInr = t.day27.freightInr - d27.filter((s) => s !== b).reduce((a, s) => a + s.freightInr, 0);

  // ── (c) Truck balancers ────────────────────────────────────────────────
  const truckBalancers = new Map<string, Slot>();
  for (const [plate, target] of truckTarget) {
    const cands = sept
      .filter((s) => s.plate === plate && isFree(s) && !s.kmBalancer && dayOf(s) <= 13)
      .sort((a, c) => c.plan.actualKm - a.plan.actualKm);
    const s = cands[0];
    if (!s) {
      errors.push(`${plate}: no truck-balancer trip in 1–13 Sep`);
      continue;
    }
    truckBalancers.set(plate, s);
    const now = sept.filter((x) => x.plate === plate).reduce((a, x) => a + profitInr(x), 0);
    const need = target - now;
    let dF = Math.round(need / 100) * 100;
    let other = s.otherInr + dF - need;
    while (other < OTHER_RANGE[0]) {
      dF += 100;
      other += 100;
    }
    while (other > OTHER_RANGE[1]) {
      dF -= 100;
      other -= 100;
    }
    s.freightInr += dF;
    s.otherInr = other;
  }

  // ── Bounds ─────────────────────────────────────────────────────────────
  for (const s of slots) {
    if (s.otherInr < OTHER_RANGE[0] || s.otherInr > OTHER_RANGE[1]) errors.push(`${s.key} ${s.plan.routeId}: other ₹${s.otherInr}`);
    if (!nominal.has(s) && s !== b) continue;
    const perKm = s.freightInr / s.plan.actualKm;
    const base = basePerKm(s.plan.routeId);
    if (perKm < base * FREIGHT_BAND[0] || perKm > base * FREIGHT_BAND[1]) {
      errors.push(`${s.key} ${s.plate} ${s.plan.routeId} day ${dayOf(s)}: freight ₹${perKm.toFixed(1)}/km outside the band`);
    }
  }
  return { errors, dayBalancers, truckBalancers };
}
