/**
 * Money constant and rule thresholds (technical-plan §1, §4.4, §17 TSK-02.1).
 * These are fixed: never loosen one to make a gate pass.
 */

/** Diesel is valued at ₹90 per litre. Litres are stored as integer centilitres. */
export const DIESEL_INR_PER_L = 90;

/** Every truck's tank holds 400 L. */
export const TANK_CL = 40_000;

/** Trucks refuel at the next route pump once the tank falls below 35% (§4.7 step 2). */
export const REFUEL_BELOW_CL = 14_000;

/** R1 · Stationary fuel drop. */
export const R1 = { minDropL: 15, windowMin: 30, pumpGeofenceM: 300, minStopMin: 5 } as const;

/** R2 · Refuel mismatch: fires when billed > rise × (1 + overPct/100). */
export const R2 = { overPct: 8 } as const;

/** R3 · Excess consumption: fires when used ≥ overRatio × route baseline (TP3, inclusive). */
export const R3 = { overRatio: 1.12 } as const;

/** R4 · Route deviation. */
export const R4 = { overPct: 6, detourKm: 10, offPathM: 500 } as const;

/** R5 · Toll mismatch: fires when claimed − FASTag ≥ minDiffInr. */
export const R5 = { minDiffInr: 50 } as const;

// ── Integer comparators ──────────────────────────────────────────────────
// Rules compare with these, never with float ratios, so boundary cases such as
// flag 3 (364 L vs 325 L, exactly +12.0%) cannot flip on rounding noise.
// R3's 112 and R2's 108 are R3.overRatio and R2.overPct as integer percents.
const R3_PCT = Math.round(R3.overRatio * 100);
const R2_PCT = 100 + R2.overPct;
const R4_PCT = 100 + R4.overPct;

/** R3: used ≥ 1.12 × baseline (inclusive). Both in integer centilitres. */
export function r3Fires(usedCl: number, baselineCl: number): boolean {
  return usedCl * 100 >= R3_PCT * baselineCl;
}

/** R2: billed > rise × 1.08 (strict). Both in integer centilitres. */
export function r2Fires(billedCl: number, riseCl: number): boolean {
  return billedCl * 100 > R2_PCT * riseCl;
}

/** R4 (distance test): actual > planned × 1.06 (strict). Km are compared as whole metres. */
export function r4OverKmFires(actualKm: number, plannedKm: number): boolean {
  return Math.round(actualKm * 1000) * 100 > R4_PCT * Math.round(plannedKm * 1000);
}
