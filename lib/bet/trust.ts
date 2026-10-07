/**
 * The verified ledger and trust score for one truck (TASK-23; bet-spec §8). Pure and
 * deterministic: everything is read from the memoised dataset through the existing aggregates
 * and ledgers; lib/data is read, never changed.
 *
 * Conventions (as lib/data/aggregates.ts):
 * - September is 1–27 Sep; a trip and its flags belong to the IST day the trip ended.
 * - The weights, thresholds and the verified-day rules are assumptions in content/bet/trust.ts.
 *
 * Simplifications, stated on the page:
 * - The scenario stores no time at which the owner resolved a flag, so a resolved flag
 *   (confirmed or wrong) is taken as resolved within 48 h. Only flags still waiting can be
 *   overdue; a flag's age runs from its event time (`flag.at`).
 * - A day's 48 h test is made at the end of that IST day (the strictest moment within it).
 */
import { DEMO_NOW, MIN_PER_DAY, RECONCILED_AT, SEPT_END_EXCL, SEPT_START, dayKey, istMin } from "@/lib/clock";
import { SEPT_FIRST_DAY, SEPT_LAST_DAY, ledgerFor, weeks, type DayKey } from "@/lib/data/aggregates";
import { truckByPlate } from "@/lib/data/fleet";
import { getDataset, type ReadonlyFlag, type ReadonlyTrip } from "@/lib/data/index";
import type { FlagStatus, Min, Plate } from "@/lib/data/types";
import {
  GPS_GAP_MIN,
  LEAKAGE_ZERO_AT_SHARE,
  STABILITY_ZERO_AT_CV,
  TRUST_FACTORS,
  VERIFIED_DAY,
  type TrustFactorId,
} from "@/content/bet/trust";

export type TrustFactors = Record<TrustFactorId, number>;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sumBy = <T>(xs: readonly T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

// ── Factors (pure arithmetic, each 0–1) ──────────────────────────────────
export interface TripSpan {
  start: Min;
  end: Min;
  samples: readonly { t: Min }[];
}

/** Minutes of `trip` that sit in a GPS gap longer than GPS_GAP_MIN, the ends included. */
function gapMinutes(trip: TripSpan): number {
  const ts = trip.samples.map((s) => s.t).filter((t) => t >= trip.start && t <= trip.end);
  if (ts.length === 0) return trip.end - trip.start;
  const steps = [ts[0] - trip.start, ...ts.slice(1).map((t, i) => t - ts[i]), trip.end - ts[ts.length - 1]];
  return sumBy(steps.filter((d) => d > GPS_GAP_MIN), (d) => d);
}

/** Share of trip-minutes outside GPS gaps longer than 5 min; 1 when there are no trips. */
export function completenessOf(trips: readonly TripSpan[]): number {
  const total = sumBy(trips, (t) => t.end - t.start);
  return total > 0 ? clamp01(1 - sumBy(trips, gapMinutes) / total) : 1;
}

const RESOLVE_WITHIN_MIN = VERIFIED_DAY.resolveWithinH * 60;

/** A flag still waiting more than 48 h after its event time, as of `asOf`. */
export function isOverdue(f: { status: FlagStatus; at: Min }, asOf: Min): boolean {
  return f.status === "waiting" && asOf - f.at > RESOLVE_WITHIN_MIN;
}

/** Share of flags not overdue at `asOf`; 1 when there are none. */
export function resolutionFactor(flags: readonly { status: FlagStatus; at: Min }[], asOf: Min): number {
  return flags.length ? 1 - flags.filter((f) => isOverdue(f, asOf)).length / flags.length : 1;
}

/** 1 at no leakage, 0 at LEAKAGE_ZERO_AT_SHARE of diesel ₹ or more, linear between. */
export function leakageFactor(unaccountedInr: number, dieselInr: number): number {
  return dieselInr > 0 ? clamp01(1 - unaccountedInr / dieselInr / LEAKAGE_ZERO_AT_SHARE.share) : 1;
}

/** Coefficient of variation (population); Infinity for a mean at or below zero. */
function cvOf(xs: readonly number[]): number {
  const mean = sumBy(xs, (x) => x) / xs.length;
  if (!(mean > 0)) return Infinity;
  return Math.sqrt(sumBy(xs, (x) => (x - mean) ** 2) / xs.length) / mean;
}

/** 1 for equal weeks, 0 at a CV of STABILITY_ZERO_AT_CV or more (or a mean at or below zero). */
export function stabilityFactor(weeklyPerDayInr: readonly number[]): number {
  return weeklyPerDayInr.length ? clamp01(1 - cvOf(weeklyPerDayInr) / STABILITY_ZERO_AT_CV.cv) : 0;
}

/** Days on a trip ÷ days in the window. */
export function utilisationFactor(activeDays: number, totalDays: number): number {
  return totalDays > 0 ? clamp01(activeDays / totalDays) : 0;
}

/** One decimal place, as every trust number is shown. */
const round1 = (x: number) => Math.round(x * 10) / 10;

/** A factor's points out of its weight: weight × factor, to one decimal place. */
export function trustPoints(weight: number, factor: number): number {
  return round1(weight * clamp01(factor));
}

/**
 * 0–100: the sum of each factor's rounded points (weight × factor, to one decimal place), so the
 * breakdown rows on the page add up to the score. The single definition of the score.
 */
export function trustScore(factors: TrustFactors): number {
  return round1(sumBy(TRUST_FACTORS, (f) => trustPoints(f.weight, factors[f.id])));
}

// ── One truck's September, from the dataset ──────────────────────────────
const inSeptember = (key: DayKey) => key >= SEPT_FIRST_DAY && key <= SEPT_LAST_DAY;

/** The truck's trips that ended 1–27 Sep, in dataset order (the trips behind its trucks() row). */
export function septemberTripsOf(plate: Plate): ReadonlyTrip[] {
  return getDataset().trips.filter((t) => t.plate === plate && inSeptember(dayKey(t.end)));
}

/** The truck's September flags, any status, oldest first. */
export function septemberFlagsOf(plate: Plate): ReadonlyFlag[] {
  return getDataset()
    .flags.filter((f) => f.plate === plate && inSeptember(f.dayKey))
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

export interface TruckDay {
  dayKey: DayKey;
  trips: number;
  profitInr: number;
  /** Flags on the day's trips, any status (as Today's counts). */
  flags: number;
}

/** The IST day keys 1–27 Sep, in order (the same calendar as aggregates' `days()`). */
const SEPT_DAY_KEYS: readonly DayKey[] = Array.from({ length: (SEPT_END_EXCL - SEPT_START) / MIN_PER_DAY }, (_, i) =>
  dayKey(SEPT_START + i * MIN_PER_DAY),
);

/** One point per day, 1–27 Sep, for this truck's trips. */
export function dailyOf(plate: Plate): TruckDay[] {
  const trips = septemberTripsOf(plate);
  const flags = septemberFlagsOf(plate);
  return SEPT_DAY_KEYS.map((key) => {
    const own = trips.filter((t) => dayKey(t.end) === key);
    return {
      dayKey: key,
      trips: own.length,
      profitInr: sumBy(own, (t) => ledgerFor(t.id).profitInr),
      flags: flags.filter((f) => f.dayKey === key).length,
    };
  });
}

/** 'YYYY-MM-DD' → 00:00 IST the next day. */
function dayEnd(key: DayKey): Min {
  const [y, m, d] = key.split("-").map(Number);
  return istMin(y, m, d) + MIN_PER_DAY;
}

/** The last day the morning reconciliation has closed (27 Sep at RECONCILED_AT). */
const LAST_CLOSED_DAY: DayKey = dayKey(RECONCILED_AT - MIN_PER_DAY);

export interface DayVerdict {
  dayKey: DayKey;
  verified: boolean;
  booksClosed: boolean;
  tripsReconciled: boolean;
  /** Ids of the truck's flags waiting more than 48 h at the end of the day. */
  overdueFlagIds: string[];
}

/** bet-spec §8, per day 1–27 Sep: books closed, every trip reconciled, no flag waiting over 48 h. */
export function verifiedDaysOf(plate: Plate): DayVerdict[] {
  const { ledgers } = getDataset();
  const trips = septemberTripsOf(plate);
  const flags = septemberFlagsOf(plate);
  return SEPT_DAY_KEYS.map((key) => {
    const booksClosed = key <= LAST_CLOSED_DAY;
    const tripsReconciled = trips.filter((t) => dayKey(t.end) === key).every((t) => ledgers[t.id] !== undefined);
    const overdueFlagIds = flags.filter((f) => isOverdue(f, dayEnd(key))).map((f) => f.id);
    return { dayKey: key, verified: booksClosed && tripsReconciled && overdueFlagIds.length === 0, booksClosed, tripsReconciled, overdueFlagIds };
  });
}

// ── The score ────────────────────────────────────────────────────────────
export interface TrustResult {
  factors: TrustFactors;
  score: number;
  /** The measures behind each factor, for the page's breakdown. */
  measures: {
    tripMinutes: number;
    gapMinutes: number;
    flags: number;
    overdueFlags: number;
    unaccountedInr: number;
    dieselInr: number;
    /** Profit per day in each week of September (1–7, 8–14, 15–21, 22–27). */
    weeklyPerDayInr: number[];
    activeDays: number;
    totalDays: number;
  };
}

/** The IST days 1–27 Sep on which the truck was on a trip (finished or still on the road). */
function activeDaysOf(plate: Plate): number {
  const { trips, live } = getDataset();
  const keys = new Set<DayKey>();
  for (const t of [...trips, ...live]) {
    if (t.plate !== plate) continue;
    const from = Math.max(t.start, SEPT_START);
    const to = Math.min(t.end, SEPT_END_EXCL - 1);
    for (let m = from; m <= to; m += MIN_PER_DAY) keys.add(dayKey(m));
    if (from <= to) keys.add(dayKey(to));
  }
  return keys.size;
}

/** The truck's trust factors and score, as of the demo clock (Mon 28 Sep, 7:12 AM). */
export function trustFor(plate: Plate, asOf: Min = DEMO_NOW): TrustResult {
  truckByPlate(plate); // throws on an unknown plate
  const trips = septemberTripsOf(plate);
  const flags = septemberFlagsOf(plate);
  const daily = dailyOf(plate);

  const tripMinutes = sumBy(trips, (t) => t.end - t.start);
  const gaps = sumBy(trips, gapMinutes);
  const unaccountedInr = sumBy(trips, (t) => ledgerFor(t.id).unaccountedInr);
  const dieselInr = sumBy(trips, (t) => ledgerFor(t.id).dieselInr);
  const weeklyPerDayInr = weeks().map((w) => {
    const inWeek = daily.filter((d) => d.dayKey >= w.from && d.dayKey <= w.to);
    return sumBy(inWeek, (d) => d.profitInr) / inWeek.length;
  });
  const activeDays = activeDaysOf(plate);
  const totalDays = daily.length;

  const factors: TrustFactors = {
    completeness: completenessOf(trips),
    resolution: resolutionFactor(flags, asOf),
    leakage: leakageFactor(unaccountedInr, dieselInr),
    stability: stabilityFactor(weeklyPerDayInr),
    utilisation: utilisationFactor(activeDays, totalDays),
  };
  return {
    factors,
    score: trustScore(factors),
    measures: {
      tripMinutes,
      gapMinutes: gaps,
      flags: flags.length,
      overdueFlags: flags.filter((f) => isOverdue(f, asOf)).length,
      unaccountedInr,
      dieselInr,
      weeklyPerDayInr,
      activeDays,
      totalDays,
    },
  };
}
