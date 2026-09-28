/**
 * The trip ledger (technical-plan §4.5).
 *
 * - dieselCl = (tank start + Σ tank rises − tank end) + Σ R2 short-filled cL.
 *   The tank readings are the sensor's settled, noise-free values
 *   (Trip.tank, RefuelBill.tankRiseCl; EXE6), so the diesel is exact.
 * - dieselInr = round(dieselCl × 90 / 100).
 * - unaccountedCl = Σ R1, R2, R3 flag litres × 100, leaving out flags the
 *   owner marked wrong. It sits inside dieselInr ("of which unaccounted") and
 *   is never subtracted twice.
 * - tollsInr = Σ FASTag (a claim above FASTag is the R5 flag).
 * - profit = freight − dieselInr − tollsInr − allowance − other.
 */
import { DIESEL_INR_PER_L } from "./constants";
import type { Flag, Trip, TripLedger } from "./types";

const DIESEL_RULES = new Set(["R1", "R2", "R3"]);

export const clToInr = (cl: number) => Math.round((cl * DIESEL_INR_PER_L) / 100);

export function ledgerFor(trip: Trip, flags: readonly Flag[]): TripLedger {
  const own = flags.filter((f) => f.tripId === trip.id);
  const risesCl = trip.refuels.reduce((a, r) => a + r.tankRiseCl, 0);
  const shortCl = own.filter((f) => f.rule === "R2").reduce((a, f) => a + (f.litres ?? 0) * 100, 0);
  const dieselCl = trip.tank.startCl + risesCl - trip.tank.endCl + shortCl;
  const unaccountedCl = own.filter((f) => DIESEL_RULES.has(f.rule) && f.status !== "wrong").reduce((a, f) => a + (f.litres ?? 0) * 100, 0);
  const dieselInr = clToInr(dieselCl);
  const tollsInr = trip.fastag.reduce((a, e) => a + e.inr, 0);
  const { allowanceInr, otherInr } = trip.claims;
  return {
    freightInr: trip.freightInr,
    dieselCl,
    dieselInr,
    unaccountedCl,
    unaccountedInr: clToInr(unaccountedCl),
    tollsInr,
    allowanceInr,
    otherInr,
    profitInr: trip.freightInr - dieselInr - tollsInr - allowanceInr - otherInr,
  };
}
