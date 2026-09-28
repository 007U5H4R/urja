/**
 * The Today view model (technical-plan §4.6). Components render these fields
 * and nothing else: every ₹ and count on Today comes from here.
 *
 * TSK-02.6 builds the head (greeting, verdict, tags, ledger bar) with
 * `getTodayHead()`. TKT-04 fills `eyes`, `cleanLine`, `september` and
 * `trucks`; TKT-10 fills `hero` and `fleetNow`. Until then those fields are
 * optional, and each later ticket narrows its own.
 */
import { DEMO_NOW, MIN_PER_DAY, RECONCILED_AT } from "@/lib/clock";
import { formatDateIST, formatINR, formatTimeIST, minToISTParts } from "@/lib/format";
import { yesterday, type FleetNowView, type TruckRow } from "../aggregates";
import type { Confidence, Plate, TripId } from "../types";

// ── Contract ─────────────────────────────────────────────────────────────
export type LedgerPartKey = "diesel" | "tolls" | "other" | "profit";

export interface LedgerPart {
  key: LedgerPartKey;
  inr: number;
  /** Share of freight, rounded to 0.1%; profit takes the remainder so the four sum to 100. */
  pct: number;
}

export interface TodayLedger {
  freightInr: number;
  parts: LedgerPart[];
  ariaLabel: string;
}

export interface EyeRow {
  n: 1 | 2 | 3;
  tripId: TripId;
  plate: Plate;
  driver: string;
  route: string;
  inr: number;
  what: string;
  confidence: Confidence;
  driverStatus: { text: string; tone: "default" | "wait" };
}

/** The four September KPI cards (final/index.html "September so far"): plain numbers only. TKT-04 builds it. */
export interface SeptemberKpis {
  trips: number;
  diesel: {
    litres: number;
    inr: number;
    lastWeekL: number;
    /** Running total per day, 1–27 Sep. */
    cumulativeL: number[];
    /** Days of the month with an incident. */
    incidentDays: number[];
    behror: { count: number; of: number };
  };
  recovered: {
    inr: number;
    flaggedInr: number;
    sharePct: number;
    weeks: { label: string; flaggedInr: number; recoveredInr: number; bricks: { lit: number; total: number } }[];
  };
  wrong: { count: number; of: number; pct: number; limitPct: number; confirmed: number; waiting: number };
  perKm: {
    /** ₹/km of all 24 trucks, best first. */
    values: number[];
    best: { perKm: number; plate: Plate; driver: string; flags: number };
    bottomAllFlagged: boolean;
  };
}

/** TKT-10 extends this with the hero card's rows, rail and map selection. */
export interface HeroFlag {
  n: 1 | 2 | 3;
  tripId: TripId;
  plate: Plate;
}

export interface TodayView {
  greeting: { en: string };
  /** `flaggedTrips`: yesterday's trips with a flag that is not marked wrong. */
  verdict: { earnedInr: number; unaccountedInr: number; flaggedTrips: number };
  tags: { day: string; reconciled: string };
  ledger: TodayLedger;
  eyes?: EyeRow[];
  cleanLine?: { others: number };
  september?: SeptemberKpis;
  trucks?: { rows: TruckRow[]; hiddenRange: [number, number] | null; hiddenCount: number };
  hero?: HeroFlag[];
  fleetNow?: FleetNowView;
}

export type TodayHead = Pick<TodayView, "greeting" | "verdict" | "tags" | "ledger">;

// ── Builders ─────────────────────────────────────────────────────────────
/** The fleet owner, as the greeting addresses him. */
export const OWNER_SALUTATION = "Sharma ji";

function greeting(): string {
  const { hour } = minToISTParts(DEMO_NOW);
  const partOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${partOfDay}, ${OWNER_SALUTATION} · ${formatDateIST(DEMO_NOW, "long")}`;
}

const TENTHS = 1000;

/** Splits `total` tenths across `weights` (all ≥ 0, Σ > 0) by largest remainder, so they sum exactly. */
function apportion(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, w) => a + w, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const out = exact.map(Math.floor);
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; k < total - out.reduce((a, x) => a + x, 0); k++) out[order[k][1]]++;
  return out;
}

/**
 * The ledger bar's widths. Each cost is its share of freight rounded to 0.1%
 * (in integer tenths); profit takes the remainder, so the four sum to 100.
 * Widths are never negative: with no freight all four are 0, and when the
 * costs exceed freight they fill the bar in proportion and profit gets 0.
 * The ₹ amounts are passed through unchanged.
 */
export function ledgerParts(
  freightInr: number,
  costs: { key: Exclude<LedgerPartKey, "profit">; inr: number }[],
  profitInr: number,
): LedgerPart[] {
  const weights = costs.map((c) => Math.max(0, c.inr));
  let tenths: number[];
  let profitTenths: number;
  if (freightInr <= 0) {
    tenths = costs.map(() => 0);
    profitTenths = 0;
  } else {
    tenths = weights.map((w) => Math.round((w / freightInr) * TENTHS));
    const used = tenths.reduce((a, t) => a + t, 0);
    if (used <= TENTHS) profitTenths = TENTHS - used;
    else {
      tenths = apportion(weights, TENTHS);
      profitTenths = 0;
    }
  }
  return [
    ...costs.map((c, i) => ({ key: c.key, inr: c.inr, pct: tenths[i] / 10 })),
    { key: "profit" as const, inr: profitInr, pct: profitTenths / 10 },
  ];
}

/** Today's page head and ledger bar: yesterday's verdict (§4.6, TSK-02.6). */
export function getTodayHead(): TodayHead {
  const y = yesterday();
  const flaggedTrips = new Set(y.flags.filter((f) => f.status !== "wrong").map((f) => f.tripId));
  const trips = y.trips === 1 ? "trip" : "trips";
  return {
    greeting: { en: greeting() },
    verdict: { earnedInr: y.profitInr, unaccountedInr: y.unaccountedInr, flaggedTrips: flaggedTrips.size },
    tags: {
      day: `Yesterday · ${formatDateIST(DEMO_NOW - MIN_PER_DAY, "weekday-day-month")}`,
      reconciled: `${y.trips} ${trips} reconciled at ${formatTimeIST(RECONCILED_AT)}`,
    },
    ledger: {
      freightInr: y.freightInr,
      parts: ledgerParts(
        y.freightInr,
        [
          { key: "diesel", inr: y.dieselInr },
          { key: "tolls", inr: y.tollsInr },
          { key: "other", inr: y.otherInr },
        ],
        y.profitInr,
      ),
      ariaLabel:
        `Yesterday's ledger: freight billed ${formatINR(y.freightInr)}; diesel ${formatINR(y.dieselInr)}; ` +
        `tolls ${formatINR(y.tollsInr)}; driver allowance and other ${formatINR(y.otherInr)}; profit ${formatINR(y.profitInr)}`,
    },
  };
}
