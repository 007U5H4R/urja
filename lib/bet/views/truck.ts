/**
 * The truck lender view (TASK-23; bet-spec §8): the view model behind /trucks/[plate]. Components
 * render these fields and nothing else; every ₹ is computed here from the dataset and arrives
 * formatted through lib/format.ts.
 *
 * - The headline is the truck's trucks() row, so it matches Today's table exactly.
 * - The daily series, flags and ledgers are this truck's September (1–27 Sep) trips.
 * - Verified days follow bet-spec §8 with the simplifications in lib/bet/trust.ts, stated in
 *   `verified.note`. The months strip shows September as recorded and Oct–Feb as not yet
 *   recorded, with no amounts: no projected months.
 * - Loan readiness is illustrative: an EMI headroom from the surplus over the verified days (its
 *   window named, never called monthly), a labelled share, and the consent step before anything
 *   reaches a lending partner.
 * - The trust score is trustFor's score (lib/bet/trust.ts), defined there as the sum of the rounded
 *   breakdown rows, so the rows add up on screen.
 */
import { istMin } from "@/lib/clock";
import { formatDateIST, formatINR, formatKm } from "@/lib/format";
import { SEPT_FIRST_DAY, SEPT_LAST_DAY, trucks, type DayKey } from "@/lib/data/aggregates";
import type { Confidence, FlagStatus, Plate, RuleId, TripId } from "@/lib/data/types";
import type { CitedClaim, Claim } from "@/content/bet/sources";
import {
  GPS_GAP_MIN,
  LOAN_ASSUMPTIONS,
  LOAN_CONSENT,
  LOAN_CONTEXT,
  LOAN_PARTNERSHIP,
  TRUST_FACTORS,
  VERIFIED_DAY,
  VERIFIED_DAYS_TARGET,
  VERIFIED_MONTH,
  type TrustFactorId,
} from "@/content/bet/trust";
import { slugToPlate } from "../slug";
import { dailyOf, septemberFlagsOf, trustFor, trustPoints, verifiedDaysOf } from "../trust";

// ── Contract ─────────────────────────────────────────────────────────────
export interface TruckHeadline {
  rank: number;
  /** How many trucks are ranked (24). */
  of: number;
  plate: Plate;
  driver: string;
  trips: number;
  km: number;
  profitInr: number;
  perKm: number;
  unaccountedInr: number;
  flags: number;
  text: { rank: string; trips: string; km: string; profit: string; perKm: string; unaccounted: string; flags: string };
}

export interface TruckDayPoint {
  dayKey: DayKey;
  /** '1 Sep' */
  label: string;
  trips: number;
  profitInr: number;
  profitText: string;
  flags: number;
  verified: boolean;
}

export interface TruckFlagRow {
  id: string;
  tripId: TripId;
  /** The trip evidence page. */
  href: string;
  /** '26 Sep' (the day the trip ended). */
  dayLabel: string;
  rule: RuleId;
  ruleName: string;
  confidence: Confidence;
  /** 'High', 'Likely' or 'Check'. */
  confidenceWord: string;
  status: FlagStatus;
  statusText: string;
  driverSideText: string;
  inr: number;
  inrText: string;
  recoveredInr: number;
  recoveredText: string;
}

export interface TrustFactorRow {
  id: TrustFactorId;
  label: string;
  weight: number;
  /** 0–1 */
  value: number;
  /** weight × value, one decimal place. */
  points: number;
  valueText: string;
  pointsText: string;
  measure: string;
  claim: Claim;
}

export interface MonthSlot {
  /** 'Sep' … 'Feb' */
  label: string;
  state: "recorded" | "not-yet";
  /** null for a month not yet recorded. */
  verifiedDays: number | null;
  /** The verified surplus; null for a month not yet recorded. */
  surplusInr: number | null;
  surplusText: string | null;
  note: string;
}

export interface TruckView {
  slug: string;
  plate: Plate;
  headline: TruckHeadline;
  daily: TruckDayPoint[];
  completeness: { share: number; text: string; note: string };
  resolution: {
    total: number;
    resolved: number;
    confirmed: number;
    wrong: number;
    waiting: number;
    /** Waiting more than 48 h at the demo clock. */
    overdue: number;
    driverSide: { notAsked: number; replied: number; cleared: number; confirmed: number };
    flaggedInr: number;
    recoveredInr: number;
    text: { resolved: string; flagged: string; recovered: string; driverSide: string };
  };
  verified: {
    days: number;
    recordedDays: number;
    target: number;
    dayKeys: DayKey[];
    /** '27 of 180 verified days' */
    text: string;
    definition: string;
    note: string;
  };
  months: MonthSlot[];
  trust: { score: number; scoreText: string; label: string; factors: TrustFactorRow[]; note: string };
  loan: {
    illustrative: true;
    verifiedSurplusInr: number;
    emiHeadroomInr: number;
    tenorMonths: number;
    lines: string[];
    consent: Claim;
    partnership: Claim;
    /** What the sources themselves say about the rails the consent step would use. */
    context: CitedClaim[];
    assumptions: Claim[];
  };
  flagList: TruckFlagRow[];
}

// ── Wording ──────────────────────────────────────────────────────────────
const RULE_NAME: Record<RuleId, string> = {
  R1: "Stationary fuel drop",
  R2: "Refuel mismatch",
  R3: "Excess consumption",
  R4: "Route deviation",
  R5: "Toll mismatch",
};
const CONF_WORD: Record<Confidence, string> = { high: "High", likely: "Likely", check: "Check" };
const STATUS_TEXT: Record<FlagStatus, string> = { waiting: "Waiting on you", confirmed: "Confirmed", wrong: "Marked wrong" };
const DRIVER_SIDE_TEXT = {
  "not-asked": "Driver not asked yet",
  replied: "Driver explained",
  cleared: "Cleared by the driver's side",
  confirmed: "Driver confirmed",
} as const;

/** Months on the 180-day path: September is recorded; the rest are empty slots. */
const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"] as const;

const pct = (x: number) => `${Math.round(x * 100)}%`;
const perKmText = (v: number) => `₹${v.toFixed(1)}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** Indicative amounts are shown to the nearest ₹100. */
const round100 = (x: number) => Math.round(x / 100) * 100;

/** 'YYYY-MM-DD' → '1 Sep', through the IST formatter. */
function dayLabel(key: DayKey): string {
  const [y, m, d] = key.split("-").map(Number);
  return formatDateIST(istMin(y, m, d), "day-month");
}

/** The recorded window, '1–27 Sep'. */
const WINDOW_TEXT = `${Number(SEPT_FIRST_DAY.slice(8))}–${dayLabel(SEPT_LAST_DAY)}`;

// ── View ─────────────────────────────────────────────────────────────────
/** The lender view of the truck behind `slug`; null when no truck in the fleet has it. */
export function getTruckView(slug: string): TruckView | null {
  const plate = slugToPlate(slug);
  if (!plate) return null;
  const rows = trucks();
  const row = rows.find((r) => r.plate === plate);
  if (!row) return null;

  const flags = septemberFlagsOf(plate);
  const verdicts = verifiedDaysOf(plate);
  const verifiedKeys = new Set(verdicts.filter((v) => v.verified).map((v) => v.dayKey));
  const daily = dailyOf(plate).map((d) => ({
    dayKey: d.dayKey,
    label: dayLabel(d.dayKey),
    trips: d.trips,
    profitInr: d.profitInr,
    profitText: formatINR(d.profitInr),
    flags: d.flags,
    verified: verifiedKeys.has(d.dayKey),
  }));
  const trust = trustFor(plate);
  const m = trust.measures;

  // Headline: the trucks() row as is.
  const headline: TruckHeadline = {
    rank: row.rank,
    of: rows.length,
    plate: row.plate,
    driver: row.driver.en,
    trips: row.trips,
    km: row.km,
    profitInr: row.profitInr,
    perKm: row.perKm,
    unaccountedInr: row.unaccountedInr,
    flags: row.flags,
    text: {
      rank: `Rank ${row.rank} of ${rows.length} by profit per km`,
      trips: plural(row.trips, "trip"),
      km: formatKm(row.km),
      profit: formatINR(row.profitInr),
      perKm: `${perKmText(row.perKm)} per km`,
      unaccounted: formatINR(row.unaccountedInr),
      flags: plural(row.flags, "flag"),
    },
  };

  // Completeness.
  const completeness = {
    share: trust.factors.completeness,
    text: pct(trust.factors.completeness),
    note:
      m.gapMinutes === 0
        ? `Every trip-minute has GPS within ${GPS_GAP_MIN} min. The simulated feed has no gaps; a real feed would.`
        : `${plural(m.gapMinutes, "trip-minute")} of ${m.tripMinutes} fall in GPS gaps over ${GPS_GAP_MIN} min.`,
  };

  // Flag resolution.
  const count = (s: FlagStatus) => flags.filter((f) => f.status === s).length;
  const side = (s: keyof typeof DRIVER_SIDE_TEXT) => flags.filter((f) => f.driverSide.state === s).length;
  const flaggedInr = flags.reduce((a, f) => a + f.inr, 0);
  const recoveredInr = flags.reduce((a, f) => a + f.recoveredInr, 0);
  const driverSide = { notAsked: side("not-asked"), replied: side("replied"), cleared: side("cleared"), confirmed: side("confirmed") };
  const resolved = count("confirmed") + count("wrong");
  const resolution = {
    total: flags.length,
    resolved,
    confirmed: count("confirmed"),
    wrong: count("wrong"),
    waiting: count("waiting"),
    overdue: m.overdueFlags,
    driverSide,
    flaggedInr,
    recoveredInr,
    text: {
      resolved:
        flags.length === 0
          ? "No flags in September"
          : `${resolved} of ${plural(flags.length, "flag")} resolved` +
            (m.overdueFlags > 0 ? ` · ${m.overdueFlags} waiting over ${VERIFIED_DAY.resolveWithinH} h` : ""),
      flagged: formatINR(flaggedInr),
      recovered: formatINR(recoveredInr),
      driverSide: (["not-asked", "replied", "cleared", "confirmed"] as const)
        .filter((s) => side(s) > 0)
        .map((s) => `${DRIVER_SIDE_TEXT[s]}: ${side(s)}`)
        .join(" · "),
    },
  };

  // Verified days and months (no projections).
  const nVerified = verifiedKeys.size;
  const verifiedSurplusInr = daily.filter((d) => d.verified).reduce((a, d) => a + d.profitInr, 0);
  const target = VERIFIED_DAYS_TARGET.days;
  const verified = {
    days: nVerified,
    recordedDays: daily.length,
    target,
    dayKeys: daily.filter((d) => d.verified).map((d) => d.dayKey),
    text: `${nVerified} of ${target} verified days`,
    definition: VERIFIED_DAY.definition,
    note:
      `Resolution times aren't stored in this prototype, so a confirmed or wrong flag counts as resolved within ${VERIFIED_DAY.resolveWithinH} h; ` +
      "a flag still waiting counts from its event time, checked at the end of each day." +
      (m.overdueFlags > 0 ? ` A flag that has since passed ${VERIFIED_DAY.resolveWithinH} h counts against the next day to close.` : ""),
  };
  const months: MonthSlot[] = MONTHS.map((label, i) =>
    i === 0
      ? {
          label,
          state: "recorded",
          verifiedDays: nVerified,
          surplusInr: verifiedSurplusInr,
          surplusText: formatINR(verifiedSurplusInr),
          note:
            `${nVerified} of ${daily.length} days verified (${WINDOW_TEXT})` +
            (nVerified >= VERIFIED_MONTH.minDays ? " · a verified truck-month" : ` · ${VERIFIED_MONTH.minDays} needed for a verified truck-month`),
        }
      : { label, state: "not-yet", verifiedDays: null, surplusInr: null, surplusText: null, note: "Not yet recorded" },
  );

  // Trust score.
  const factors: TrustFactorRow[] = TRUST_FACTORS.map((f) => {
    const value = trust.factors[f.id];
    const points = trustPoints(f.weight, value);
    return { id: f.id, label: f.label, weight: f.weight, value, points, valueText: pct(value), pointsText: `${points} of ${f.weight}`, measure: f.measure, claim: f.claim };
  });
  const trustView = {
    score: trust.score,
    scoreText: trust.score.toFixed(1),
    label: `Provisional (${nVerified} days)`,
    factors,
    note: `Provisional until ${target} verified days. Weights are our assumption, to be tuned with a lending partner.`,
  };

  // Loan readiness (illustrative).
  const { emiHeadroom, tenor } = LOAN_ASSUMPTIONS;
  const emiHeadroomInr = round100(Math.max(0, verifiedSurplusInr) * emiHeadroom.share);
  const loan = {
    illustrative: true as const,
    verifiedSurplusInr,
    emiHeadroomInr,
    tenorMonths: tenor.months,
    lines: [
      `Verified surplus: ${formatINR(verifiedSurplusInr)} over ${plural(nVerified, "verified day")} (${WINDOW_TEXT})`,
      `Indicative EMI headroom: about ${formatINR(emiHeadroomInr)}, ${pct(emiHeadroom.share)} of the surplus over ${plural(nVerified, "verified day")} (${WINDOW_TEXT}) · ` +
        `illustrative, based on ${plural(daily.length, "day")}, not a forecast or an offer`,
      `Illustrative tenor: ${tenor.months} months`,
      LOAN_CONSENT.text,
    ],
    consent: LOAN_CONSENT,
    partnership: LOAN_PARTNERSHIP,
    context: [...LOAN_CONTEXT],
    assumptions: [emiHeadroom.claim, tenor.claim],
  };

  // Flags, oldest first, each linking to its trip.
  const flagList: TruckFlagRow[] = flags.map((f) => ({
    id: f.id,
    tripId: f.tripId,
    href: `/trips/${f.tripId}`,
    dayLabel: dayLabel(f.dayKey),
    rule: f.rule,
    ruleName: RULE_NAME[f.rule],
    confidence: f.confidence,
    confidenceWord: CONF_WORD[f.confidence],
    status: f.status,
    statusText: STATUS_TEXT[f.status],
    driverSideText: DRIVER_SIDE_TEXT[f.driverSide.state],
    inr: f.inr,
    inrText: formatINR(f.inr),
    recoveredInr: f.recoveredInr,
    recoveredText: formatINR(f.recoveredInr),
  }));

  return {
    slug: slug.toLowerCase(),
    plate,
    headline,
    daily,
    completeness,
    resolution,
    verified,
    months,
    trust: trustView,
    loan,
    flagList,
  };
}
