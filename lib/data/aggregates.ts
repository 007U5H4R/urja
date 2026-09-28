/**
 * Aggregates over the memoised dataset (technical-plan §4.6). Every figure a
 * screen, the brief or Ask shows comes from here or from a view built on it.
 *
 * Conventions (§1, §4.3):
 * - A trip belongs to the IST day it ended (`dayKey(end)`); so do its flags.
 * - "September so far" is trips that ended 1–27 Sep. Trips still on the road
 *   at DEMO_NOW (`dataset.live`) are in no aggregate but `fleetNow()`.
 * - "Diesel" flags are R1, R2 and R3; they carry litres. Unaccounted ₹ leaves
 *   out flags the owner marked wrong.
 * - Flags within a day are ordered High → Likely → Check, then by ₹ (the
 *   order of Today's "Needs your eyes" rows).
 */
import { DEMO_NOW, MIN_PER_DAY, SEPT_END_EXCL, SEPT_START, dayKey, istMin } from "@/lib/clock";
import { FLEET, truckByPlate } from "./fleet";
import { DIESEL_RULES } from "./constants";
import { getDataset, type ReadonlyFlag, type ReadonlyLedger, type ReadonlyTrip } from "./index";
import { routeById, STRETCHES, type StretchId } from "./routes";
import type { Bilingual, Confidence, LngLat, Min, Plate, TripId } from "./types";

type Flag = ReadonlyFlag;
type Trip = ReadonlyTrip;

// ── Calendar ─────────────────────────────────────────────────────────────
export type DayKey = string;

/** 'YYYY-MM-DD' → 00:00 IST that day. */
function dayStart(key: DayKey): Min {
  const [y, m, d] = key.split("-").map(Number);
  return istMin(y, m, d);
}

/** Every day key from `from` to `to`, inclusive. */
function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let t = dayStart(from); t <= dayStart(to); t += MIN_PER_DAY) out.push(dayKey(t));
  return out;
}

export const SEPT_FIRST_DAY: DayKey = dayKey(SEPT_START);
export const SEPT_LAST_DAY: DayKey = dayKey(SEPT_END_EXCL - 1);
export const YESTERDAY_DAY: DayKey = dayKey(DEMO_NOW - MIN_PER_DAY);

const inSeptember = (key: DayKey) => key >= SEPT_FIRST_DAY && key <= SEPT_LAST_DAY;
const dayOfMonth = (key: DayKey) => Number(key.slice(8));

// ── Flags ────────────────────────────────────────────────────────────────
export const isDiesel = (f: Flag) => DIESEL_RULES.includes(f.rule);
const counts = (f: Flag) => f.status !== "wrong";

const CONFIDENCE_ORDER: Record<Confidence, number> = { high: 0, likely: 1, check: 2 };

/** High → Likely → Check, then larger ₹ first, then id. */
export function byEyeOrder(a: Flag, b: Flag): number {
  return CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] || b.inr - a.inr || a.id.localeCompare(b.id);
}

/** Day first, then eye order within the day. */
const byDayThenEye = (a: Flag, b: Flag) => a.dayKey.localeCompare(b.dayKey) || byEyeOrder(a, b);

const sumBy = <T>(xs: readonly T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const litresOf = (f: Flag) => f.litres ?? 0;

/** The flags on one trip, in eye order. */
export function flagsForTrip(tripId: TripId): Flag[] {
  return getDataset().flags.filter((f) => f.tripId === tripId).sort(byEyeOrder);
}

// ── Trips and ledgers ────────────────────────────────────────────────────
/** A finished trip's ledger (§4.5); throws for a live or unknown trip. */
export function ledgerFor(tripId: TripId): ReadonlyLedger {
  const l = getDataset().ledgers[tripId];
  if (!l) throw new Error(`No ledger for trip ${tripId} (unknown, or still on the road)`);
  return l;
}

function tripsEndingOn(key: DayKey): Trip[] {
  return getDataset().trips.filter((t) => dayKey(t.end) === key);
}

function septemberTrips(): Trip[] {
  return getDataset().trips.filter((t) => inSeptember(dayKey(t.end)));
}

function septemberFlags(): Flag[] {
  return getDataset().flags.filter((f) => inSeptember(f.dayKey));
}

// ── Days ─────────────────────────────────────────────────────────────────
export interface DaySummary {
  dayKey: DayKey;
  trips: number;
  tripIds: TripId[];
  freightInr: number;
  dieselCl: number;
  dieselInr: number;
  tollsInr: number;
  allowanceInr: number;
  /** Loading and other costs, without the driver allowance. */
  miscInr: number;
  /** Driver allowance + other: the ledger bar's "Allowance & other". */
  otherInr: number;
  profitInr: number;
  unaccountedInr: number;
  unaccountedL: number;
  /** Every flag on the day's trips, in eye order, including flags the owner marked wrong. */
  flags: Flag[];
  /** Trips on routes through the Udaipur stretch (the data-late specimen). */
  udaipurTrips: number;
}

/** Everything about the trips that ended on one IST day. */
export function day(key: DayKey): DaySummary {
  const trips = tripsEndingOn(key);
  const L = (t: Trip) => ledgerFor(t.id);
  const allowanceInr = sumBy(trips, (t) => L(t).allowanceInr);
  const miscInr = sumBy(trips, (t) => L(t).otherInr);
  return {
    dayKey: key,
    trips: trips.length,
    tripIds: trips.map((t) => t.id),
    freightInr: sumBy(trips, (t) => L(t).freightInr),
    dieselCl: sumBy(trips, (t) => L(t).dieselCl),
    dieselInr: sumBy(trips, (t) => L(t).dieselInr),
    tollsInr: sumBy(trips, (t) => L(t).tollsInr),
    allowanceInr,
    miscInr,
    otherInr: allowanceInr + miscInr,
    profitInr: sumBy(trips, (t) => L(t).profitInr),
    unaccountedInr: sumBy(trips, (t) => L(t).unaccountedInr),
    unaccountedL: sumBy(trips, (t) => L(t).unaccountedCl) / 100,
    flags: getDataset().flags.filter((f) => f.dayKey === key).sort(byEyeOrder),
    udaipurTrips: trips.filter((t) => routeById(t.routeId).stretches.includes("udaipur")).length,
  };
}

/** Sun 27 Sep: the day Today's verdict is about. */
export function yesterday(): DaySummary {
  return day(YESTERDAY_DAY);
}

/** Profit of the trips that ended on one IST day. */
export function dayProfit(key: DayKey): number {
  return sumBy(tripsEndingOn(key), (t) => ledgerFor(t.id).profitInr);
}

export interface DayPoint { dayKey: DayKey; trips: number; flags: number; profitInr: number }

/** One point per day, `from`–`to` inclusive (the brief's 14-day series). */
export function days(from: DayKey, to: DayKey): DayPoint[] {
  const { flags } = getDataset();
  return dayRange(from, to).map((key) => ({
    dayKey: key,
    trips: tripsEndingOn(key).length,
    flags: flags.filter((f) => f.dayKey === key).length,
    profitInr: dayProfit(key),
  }));
}

/** September days up to `upTo` on which trips ended and none was flagged. */
export function cleanDays(upTo: DayKey): DayKey[] {
  return days(SEPT_FIRST_DAY, upTo).filter((d) => d.trips > 0 && d.flags === 0).map((d) => d.dayKey);
}

// ── September ────────────────────────────────────────────────────────────
export interface SeptemberSummary {
  fromDay: DayKey;
  toDay: DayKey;
  trips: number;
  /** Diesel unaccounted (R1–R3, not wrong). */
  dieselL: number;
  dieselInr: number;
  /** The diesel flags, by day, eye order within a day (D1…D9). */
  incidents: Flag[];
  /** Running total of `dieselL` at the end of each day, 1 Sep → 27 Sep. */
  cumulativeL: number[];
  /** Diesel litres in the last 7 days (21–27 Sep). */
  lastWeekL: number;
  behror: { count: number; of: number };
  flags: number;
  confirmed: number;
  waiting: number;
  wrong: number;
  /** Wrong flags as a whole % of all flags. */
  wrongPct: number;
  flaggedInr: number;
  recoveredInr: number;
  /** Recovered as a whole % of flagged. */
  sharePct: number;
}

export function september(): SeptemberSummary {
  const flags = septemberFlags();
  const incidents = flags.filter((f) => isDiesel(f) && counts(f)).sort(byDayThenEye);
  let acc = 0;
  const cumulativeL = dayRange(SEPT_FIRST_DAY, SEPT_LAST_DAY).map((key) => {
    acc += sumBy(incidents.filter((f) => f.dayKey === key), litresOf);
    return acc;
  });
  const status = (s: Flag["status"]) => flags.filter((f) => f.status === s).length;
  const flaggedInr = sumBy(flags, (f) => f.inr);
  const recoveredInr = sumBy(flags, (f) => f.recoveredInr);
  const dieselL = sumBy(incidents, litresOf);
  return {
    fromDay: SEPT_FIRST_DAY,
    toDay: SEPT_LAST_DAY,
    trips: septemberTrips().length,
    dieselL,
    dieselInr: sumBy(incidents, (f) => f.inr),
    incidents,
    cumulativeL,
    lastWeekL: last7().litres,
    behror: { count: stretch("behror").dieselCount, of: incidents.length },
    flags: flags.length,
    confirmed: status("confirmed"),
    waiting: status("waiting"),
    wrong: status("wrong"),
    wrongPct: flags.length ? Math.round((status("wrong") / flags.length) * 100) : 0,
    flaggedInr,
    recoveredInr,
    sharePct: flaggedInr ? Math.round((recoveredInr / flaggedInr) * 100) : 0,
  };
}

export interface WeekSummary {
  from: DayKey;
  to: DayKey;
  /** '1–7' */
  label: string;
  flaggedInr: number;
  recoveredInr: number;
  /** One brick per ~₹1,000 flagged; lit bricks are recovered. */
  bricks: { lit: number; total: number };
}

const WEEKS: readonly (readonly [number, number])[] = [[1, 7], [8, 14], [15, 21], [22, 27]];
const BRICK_INR = 1000;

/** Flagged and recovered ₹ by week of September. */
export function weeks(): WeekSummary[] {
  const flags = septemberFlags();
  const key = (d: number) => `${SEPT_FIRST_DAY.slice(0, 8)}${String(d).padStart(2, "0")}`;
  return WEEKS.map(([a, b]) => {
    const inWeek = flags.filter((f) => dayOfMonth(f.dayKey) >= a && dayOfMonth(f.dayKey) <= b);
    const flaggedInr = sumBy(inWeek, (f) => f.inr);
    const recoveredInr = sumBy(inWeek, (f) => f.recoveredInr);
    return {
      from: key(a),
      to: key(b),
      label: `${a}–${b}`,
      flaggedInr,
      recoveredInr,
      bricks: { lit: Math.round(recoveredInr / BRICK_INR), total: Math.round(flaggedInr / BRICK_INR) },
    };
  });
}

// ── Last 7 days, stretches, trucks' diesel ───────────────────────────────
export interface DieselTotal { litres: number; inr: number; tripIds: TripId[]; flags: Flag[] }

function dieselTotal(flags: Flag[]): DieselTotal {
  return { litres: sumBy(flags, litresOf), inr: sumBy(flags, (f) => f.inr), tripIds: flags.map((f) => f.tripId), flags };
}

/** Diesel unaccounted over the 7 days ending yesterday (21–27 Sep). */
export function last7(): DieselTotal & { fromDay: DayKey; toDay: DayKey } {
  const fromDay = dayKey(DEMO_NOW - 7 * MIN_PER_DAY);
  const flags = septemberFlags()
    .filter((f) => isDiesel(f) && counts(f) && f.dayKey >= fromDay && f.dayKey <= YESTERDAY_DAY)
    .sort(byDayThenEye);
  return { fromDay, toDay: YESTERDAY_DAY, ...dieselTotal(flags) };
}

export interface StretchSummary {
  id: StretchId;
  name: Bilingual;
  /** Every September flag placed on the stretch, by day. */
  flags: Flag[];
  /** Of those, the diesel flags that count (R1–R3, not wrong). */
  dieselCount: number;
  litres: number;
  inr: number;
}

/** September flags on a named stretch (placed at its centre place, e.g. Behror). */
export function stretch(id: StretchId): StretchSummary {
  const s = STRETCHES[id];
  const flags = septemberFlags().filter((f) => f.placeId === s.centerPlaceId).sort(byDayThenEye);
  const diesel = flags.filter((f) => isDiesel(f) && counts(f));
  return { id, name: s.name, flags, dieselCount: diesel.length, litres: sumBy(diesel, litresOf), inr: sumBy(diesel, (f) => f.inr) };
}

/** One truck's September diesel unaccounted, newest first (Ask: "which driver cost me the most diesel"). */
export function truckDiesel(plate: Plate): DieselTotal {
  truckByPlate(plate); // throws on an unknown plate
  const flags = septemberFlags()
    .filter((f) => f.plate === plate && isDiesel(f) && counts(f))
    .sort((a, b) => b.at - a.at);
  return dieselTotal(flags);
}

// ── Trucks ───────────────────────────────────────────────────────────────
export type NowState = "moving" | "yard" | "workshop";

export interface TruckRow {
  rank: number;
  plate: Plate;
  driver: Bilingual;
  since: number;
  trips: number;
  /** September km, whole km. */
  km: number;
  profitInr: number;
  /** September profit ÷ km, to 1 decimal place. */
  perKm: number;
  /** Σ ₹ of the truck's September flags that are not wrong (all rules). */
  unaccountedInr: number;
  /** How many September flags the truck has (any status). */
  flags: number;
  now: { state: NowState; label: Bilingual };
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/** The 24 trucks ranked by September ₹/km, best first. */
export function trucks(): TruckRow[] {
  const trips = septemberTrips();
  const flags = septemberFlags();
  const now = new Map(getDataset().scenario.now.trucks.map((n) => [n.plate, n]));
  const rows = FLEET.map((truck) => {
    const own = trips.filter((t) => t.plate === truck.plate);
    const km = sumBy(own, (t) => t.actualKm);
    const profitInr = sumBy(own, (t) => ledgerFor(t.id).profitInr);
    const ownFlags = flags.filter((f) => f.plate === truck.plate);
    const n = now.get(truck.plate);
    if (!n) throw new Error(`No now-position for ${truck.plate}`);
    return {
      exact: km ? profitInr / km : 0,
      row: {
        rank: 0,
        plate: truck.plate,
        driver: truck.driver.name,
        since: truck.driver.since,
        trips: own.length,
        km: Math.round(km),
        profitInr,
        perKm: km ? round1(profitInr / km) : 0,
        unaccountedInr: sumBy(ownFlags.filter(counts), (f) => f.inr),
        flags: ownFlags.length,
        now: { state: n.state, label: n.label },
      } satisfies TruckRow,
    };
  });
  rows.sort((a, b) => b.row.perKm - a.row.perKm || b.exact - a.exact || a.row.plate.localeCompare(b.row.plate));
  return rows.map(({ row }, i) => ({ ...row, rank: i + 1 }));
}

/** Today's table shows ranks 1–5 and the bottom 3; the gap row sums up the rest. */
export const TRUCKS_SHOWN = { top: 5, bottom: 3 } as const;

export interface TruckGap {
  count: number;
  /** [lowest, highest] ₹/km of the hidden trucks; null when none is hidden. */
  range: [number, number] | null;
}

/** The gap between the top 5 and the bottom 3 of ranked rows; empty for a fleet of 8 or fewer. */
export function gapOf(rows: readonly TruckRow[]): TruckGap {
  if (rows.length <= TRUCKS_SHOWN.top + TRUCKS_SHOWN.bottom) return { count: 0, range: null };
  const hidden = rows.slice(TRUCKS_SHOWN.top, rows.length - TRUCKS_SHOWN.bottom).map((r) => r.perKm);
  return { count: hidden.length, range: [Math.min(...hidden), Math.max(...hidden)] };
}

/** The table's gap row: "16 more trucks between ₹16.9 and ₹25.0 per km". */
export function truckGap(): TruckGap {
  return gapOf(trucks());
}

// ── Route normal ─────────────────────────────────────────────────────────
/** How many earlier trips make a route's normal. */
export const ROUTE_NORMAL_TRIPS = 13;

export interface RouteNormal {
  normalInr: number;
  /** The earlier clean trips on the route, oldest first. */
  history: { tripId: TripId; dayKey: DayKey; profitInr: number }[];
}

/**
 * The route's normal profit for a trip: the mean profit of the last 13 clean
 * trips (no flags) on the same route that ended before it did. `null` when
 * the route has no earlier clean trip in the dataset.
 */
export function routeNormal(tripId: TripId): RouteNormal | null {
  const { trips, flags } = getDataset();
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) throw new Error(`No finished trip ${tripId}`);
  const flagged = new Set(flags.map((f) => f.tripId));
  const history = trips
    .filter((t) => t.routeId === trip.routeId && t.end < trip.end && !flagged.has(t.id))
    .sort((a, b) => a.end - b.end || a.id.localeCompare(b.id))
    .slice(-ROUTE_NORMAL_TRIPS)
    .map((t) => ({ tripId: t.id, dayKey: dayKey(t.end), profitInr: ledgerFor(t.id).profitInr }));
  if (history.length === 0) return null;
  return { normalInr: Math.round(sumBy(history, (h) => h.profitInr) / history.length), history };
}

// ── Now ──────────────────────────────────────────────────────────────────
export interface FleetNowTruck {
  plate: Plate;
  driver: Bilingual;
  state: NowState;
  label: Bilingual;
  lngLat: Readonly<LngLat>;
}

export interface FleetNowView {
  at: Min;
  trucks: FleetNowTruck[];
  counts: Record<NowState, number>;
}

/** Where the 24 trucks are at DEMO_NOW (the hero's Fleet view, the empty-state counts). */
export function fleetNow(): FleetNowView {
  const now = getDataset().scenario.now;
  const trucks = now.trucks.map((n) => ({
    plate: n.plate,
    driver: truckByPlate(n.plate).driver.name,
    state: n.state,
    label: n.label,
    lngLat: n.lngLat,
  }));
  const counts: Record<NowState, number> = { moving: 0, yard: 0, workshop: 0 };
  for (const t of trucks) counts[t.state]++;
  return { at: now.at, trucks, counts };
}
