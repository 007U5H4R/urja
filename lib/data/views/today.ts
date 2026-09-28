/**
 * The Today view model (technical-plan §4.6). Components render these fields
 * and nothing else: every ₹ and count on Today comes from here.
 *
 * TSK-02.6 builds the head (greeting, verdict, tags, ledger bar) with
 * `getTodayHead()`. TKT-04 fills `eyes`, `cleanLine`, `september` and
 * `trucks`; TKT-10 fills `hero` and `fleetNow`. Until then those fields are
 * optional, and each later ticket narrows its own.
 */
import { DEMO_NOW, MIN_PER_DAY, RECONCILED_AT, SEPT_START, istMin } from "@/lib/clock";
import { formatDateIST, formatINR, formatTimeIST, minToISTParts } from "@/lib/format";
import {
  BRICK_INR,
  gapOf,
  last7,
  september as septemberSummary,
  stretch,
  TRUCKS_SHOWN,
  trucks as rankedTrucks,
  weeks as septemberWeeks,
  yesterday,
  type FleetNowView,
  type TruckRow,
} from "../aggregates";
import { WRONG_FLAG_LIMIT_PCT } from "../constants";
import { baselineClFor, truckByPlate } from "../fleet";
import { tripById, type ReadonlyFlag } from "../index";
import { placeById } from "../places";
import { routeById, routeName } from "../routes";
import { rangeEn } from "../rules/text";
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
  /** The row's select button label: "Show on map: RJ14 GB 4521, 38 litres diesel unaccounted near Behror". */
  selectLabel: string;
}

/** The "Needs your eyes" head: "3 of 17 trips" and yesterday's unaccounted ₹. */
export interface EyesHead {
  flaggedTrips: number;
  trips: number;
  inr: number;
  /** '3 of 17 trips' */
  countText: string;
}

/** The line under the rows; `text` is null when no trip is left to vouch for. */
export interface CleanLine {
  others: number;
  text: string | null;
}

/** Bar kinds, as components/charts/Bars takes them. */
export type KpiBarKind = "hot" | "lit" | "loss" | "dim" | "hatch";

/** A KPI card's bar chart, ready for `<Bars/>`: one entry per bar. */
export interface KpiBars {
  values: number[];
  kinds: KpiBarKind[];
  labels: (number | string | null)[];
  max: number;
  bracket?: { from: number; to: number };
}

/** One side of a KPI footer: `{text}<b>{bold}</b>{after}`. */
export interface KpiFooterPart {
  text: string;
  bold?: string;
  after?: string;
  boldTone?: "loss";
}
export type KpiFooter = [KpiFooterPart, KpiFooterPart];

/** The four September KPI cards (final/index.html "September so far"). TKT-04 builds it. */
export interface SeptemberKpis {
  /** 'September' */
  month: string;
  trips: number;
  /** '1–27 Sep' */
  range: string;
  diesel: {
    litres: number;
    inr: number;
    lastWeekL: number;
    /** Running total per day, 1–27 Sep. */
    cumulativeL: number[];
    /** Days of the month with an incident. */
    incidentDays: number[];
    behror: { name: string; count: number; of: number };
    /** The whole month: known days, then the days still to come hatched. */
    chart: KpiBars;
    ariaLabel: string;
    footer: KpiFooter;
  };
  recovered: {
    inr: number;
    flaggedInr: number;
    sharePct: number;
    weeks: { label: string; flaggedInr: number; recoveredInr: number; bricks: { lit: number; total: number } }[];
    ariaLabel: string;
    footer: KpiFooter;
  };
  wrong: {
    count: number;
    of: number;
    pct: number;
    limitPct: number;
    confirmed: number;
    waiting: number;
    underLimit: boolean;
    /** Unit squares: confirmed lit, waiting hatched, wrong crossed out. */
    groups: { n: number; kind: "lit" | "hatch" | "wrong" }[];
    meter: { value: number; limit: number; max: number; labels: [string, string, string] };
    ariaLabel: string;
    footer: KpiFooter;
  };
  perKm: {
    /** ₹/km of all 24 trucks, best first. */
    values: number[];
    best: { perKm: number; perKmText: string; plate: Plate; driver: string; flags: number };
    bottomAllFlagged: boolean;
    chart: KpiBars;
    ariaLabel: string;
    footer: KpiFooter;
  };
}

/** A trucks-table row: the ranked truck plus how the table draws it. */
export interface TodayTruckRow extends TruckRow {
  /** Behind the gap row until "All 24 trucks" is expanded. */
  hidden: boolean;
  /** `top` = rank 1 (lit), `low` = the bottom 3, `mid` = the rest. */
  tone: "top" | "mid" | "low";
  /** The minibar's width: ₹/km as a whole % of the best truck's. */
  barPct: number;
  /** `subtle` for ₹0, `loss` on the bottom rows, `plain` otherwise. */
  unaccountedTone: "subtle" | "plain" | "loss";
  /** '₹31.8' */
  perKmText: string;
}

export interface TodayTrucks {
  /** All 24, best first. */
  rows: TodayTruckRow[];
  /** [lowest, highest] ₹/km behind the gap row; null when nothing is hidden. */
  hiddenRange: [number, number] | null;
  hiddenCount: number;
  /** The gap row sits after this rank. */
  gapAfterRank: number;
  /** "16 more trucks between ₹16.9 and ₹25.0 per km"; null when nothing is hidden. */
  gapText: string | null;
  /** The table's period: 'September so far'. */
  period: string;
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
  eyesHead: EyesHead;
  eyes: EyeRow[];
  cleanLine: CleanLine;
  september: SeptemberKpis;
  trucks: TodayTrucks;
  hero?: HeroFlag[];
  fleetNow?: FleetNowView;
}

export type TodayHead = Pick<TodayView, "greeting" | "verdict" | "tags" | "ledger">;

/** Everything Today renders until TKT-10 adds the hero. */
export type TodayPage = Omit<TodayView, "hero" | "fleetNow">;

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
export function apportion(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((a, w) => a + w, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const out = exact.map(Math.floor);
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const leftover = total - out.reduce((a, x) => a + x, 0);
  for (let k = 0; k < leftover; k++) out[order[k][1]]++;
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

// ── Needs your eyes (TSK-04.1) ───────────────────────────────────────────
/** Keeps a time's AM/PM (or a distance's km) on the line with its number, as the mockup does. */
const NBSP = " ";
const glueUnit = (s: string) => s.replace(/ (AM|PM|km)$/, `${NBSP}$1`);
const INT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const firstName = (full: string) => full.split(" ")[0];
/** 'Jaipur → Delhi (Okhla)' → 'Jaipur → Delhi': the list's short route. */
const shortRoute = (routeId: string) => routeName(routeId).en.replace(/\s*\([^)]*\)/g, "");
/** 'Kishangarh pump' → 'Kishangarh'. */
const townOf = (placeName: string) => placeName.replace(/ pump$/i, "");

/** The standstill around `at` in a trip's samples: [first minute, minute after the last]. */
function standstill(tripId: TripId, at: number): { from: number; to: number; ignitionOff: boolean } {
  const { samples } = tripById(tripId);
  let k = samples.findIndex((x) => x.t >= at);
  if (k < 0) k = samples.length - 1;
  let i0 = k;
  let i1 = k;
  while (i0 > 0 && samples[i0 - 1].speedKmh === 0) i0--;
  while (i1 + 1 < samples.length && samples[i1 + 1].speedKmh === 0) i1++;
  const ignitionOff = samples.slice(i0, i1 + 1).some((x) => !x.ignition);
  return { from: samples[i0].t, to: samples[i1].t + 1, ignitionOff };
}

/** One flag's "what" line and its select-button label, in words, from the trip's own records. */
export function describeFlag(f: ReadonlyFlag): { what: string; selectLabel: string } {
  const litres = f.litres ?? 0;
  const show = (s: string) => `Show on map: ${f.plate}, ${s}`;
  switch (f.rule) {
    case "R1": {
      const stop = standstill(f.tripId, f.at);
      const near = f.placeId ? ` near ${placeById(f.placeId).name.en}` : "";
      const how = stop.ignitionOff ? "parked" : "standing";
      return {
        what: `${litres} L diesel unaccounted while ${how}${near}, ${glueUnit(rangeEn(stop.from, stop.to))}`,
        selectLabel: show(`${litres} litres diesel unaccounted${near}`),
      };
    }
    case "R2": {
      const trip = tripById(f.tripId);
      const bill = [...trip.refuels].sort((a, b) => Math.abs(a.t - f.at) - Math.abs(b.t - f.at))[0];
      if (!bill) break;
      const pump = placeById(bill.placeId).name.en;
      return {
        what: `Fuel bill says ${Math.round(bill.billedCl / 100)} L, the tank rose only ${Math.round(bill.tankRiseCl / 100)} L · ${pump}, ${glueUnit(formatTimeIST(bill.t))}`,
        selectLabel: show(`fuel bill higher than the tank rise at ${townOf(pump)}`),
      };
    }
    case "R3": {
      const trip = tripById(f.tripId);
      const normalL = baselineClFor(truckByPlate(f.plate), trip.routeId) / 100;
      const pct = Math.round((litres / normalL) * 100);
      const to = placeById(routeById(trip.routeId).to).name.en;
      return {
        what: `Used ${litres} L (${pct}%) more diesel than this truck’s normal over ${glueUnit(`${INT.format(trip.actualKm)} km`)}`,
        selectLabel: show(`${pct} percent more diesel than usual to ${to}`),
      };
    }
  }
  // R4 and R5 read as their first evidence line (no Today mockup exists for them).
  const what = f.evidence[0]?.text.en ?? "Doesn’t add up";
  return { what, selectLabel: show(what) };
}

function driverStatus(f: ReadonlyFlag): EyeRow["driverStatus"] {
  const who = firstName(truckByPlate(f.plate).driver.name.en);
  switch (f.driverSide.state) {
    case "not-asked":
      return { text: `${who} not asked yet`, tone: "default" };
    case "replied":
      return { text: `${who} explained · review`, tone: "wait" };
    case "confirmed":
      return { text: `${who} confirmed`, tone: "default" };
    case "cleared":
      return { text: `Cleared by ${who}`, tone: "default" };
  }
}

/** Yesterday's flags the owner hasn't marked wrong, in eye order (High → Likely → Check, then ₹); at most 3 rows. */
export function eyeRows(flags: readonly ReadonlyFlag[]): EyeRow[] {
  return flags
    .filter((f) => f.status !== "wrong")
    .slice(0, 3)
    .map((f, i) => {
      const trip = tripById(f.tripId);
      return {
        n: (i + 1) as EyeRow["n"],
        tripId: f.tripId,
        plate: f.plate,
        driver: truckByPlate(f.plate).driver.name.en,
        route: shortRoute(trip.routeId),
        inr: f.inr,
        ...describeFlag(f),
        confidence: f.confidence,
        driverStatus: driverStatus(f),
      };
    });
}

// ── September so far (TSK-04.1) ──────────────────────────────────────────
/** "3 of 17 trips": the list head's count. */
export function eyesCountText(flaggedTrips: number, trips: number): string {
  return `${flaggedTrips} of ${trips} ${trips === 1 ? "trip" : "trips"}`;
}

const CLEAN_TAIL = "diesel, tolls and km all match. Urja only points at what doesn’t add up. You decide.";

/** The clean line (EXE8 wording); null when every trip was flagged or there were none. */
export function cleanLineText(flaggedTrips: number, trips: number): string | null {
  const others = trips - flaggedTrips;
  if (others <= 0) return null;
  if (flaggedTrips === 0) return trips === 1 ? `Yesterday’s trip adds up: ${CLEAN_TAIL}` : `All ${trips} trips add up: ${CLEAN_TAIL}`;
  return others === 1 ? `The other trip adds up: ${CLEAN_TAIL}` : `The other ${others} trips add up: ${CLEAN_TAIL}`;
}

/** The wrong-flags card footer: who cleared the wrong flags, and how many wait on the owner. */
export function wrongFooter(wrong: number, cleared: number, waiting: number): KpiFooter {
  const side = "the driver’s side";
  let lead: KpiFooterPart;
  if (wrong === 0) lead = { text: "", bold: "No flag", after: " was wrong" };
  else if (cleared === wrong)
    lead = { text: wrong === 1 ? "Cleared by " : wrong === 2 ? "Both cleared by " : `All ${wrong} cleared by `, bold: side };
  else lead = { text: `${cleared} of ${wrong} cleared by `, bold: side };
  return [lead, { text: "", bold: String(waiting), after: " waiting on you" }];
}

/** The wrong-flags chart in words. */
export function wrongAria(a: { flags: number; confirmed: number; waiting: number; wrong: number; cleared: number; pct: number; month: string }): string {
  const wrong =
    a.wrong === 0
      ? "none was wrong"
      : `${a.wrong} ${a.wrong === 1 ? "was" : "were"} wrong` +
        (a.cleared === a.wrong ? " and cleared by the driver's side" : a.cleared > 0 ? `, ${a.cleared} cleared by the driver's side` : "");
  const vs = a.pct < WRONG_FLAG_LIMIT_PCT ? "under" : a.pct === WRONG_FLAG_LIMIT_PCT ? "at" : "over";
  return (
    `${a.flags} flags in ${a.month}: ${a.confirmed} confirmed, ${a.waiting} waiting for you, ${wrong}. ` +
    `Wrong-flag rate ${a.pct} percent, ${vs} the ${WRONG_FLAG_LIMIT_PCT} percent limit.`
  );
}

const capitalise = (s: string) => s.replace(/^\w/, (c) => c.toUpperCase());

/** How many of the bottom trucks have diesel flags, in a sentence for the per-km chart's label. */
export function perKmFlagSentence(flagged: number, bottom: number): string {
  const trucks = `the bottom ${word(bottom)} trucks`;
  if (bottom > 0 && flagged === bottom) return `${capitalise(trucks)} all have diesel flags.`;
  if (flagged === 0) return `None of ${trucks} has diesel flags.`;
  return `${capitalise(word(flagged))} of ${trucks} ${flagged === 1 ? "has" : "have"} diesel flags.`;
}

/** The per-km card's right footer: "Bottom 3 all flagged". */
export function perKmFlagFooter(flagged: number, bottom: number): KpiFooterPart {
  const bold = bottom > 0 && flagged === bottom ? "all flagged" : flagged === 0 ? "none flagged" : `${flagged} flagged`;
  return { text: `Bottom ${bottom} `, bold, boldTone: "loss" };
}

/** A chart's scale top: 1.05 × the largest value, rounded up to `step` (440 for 412 L, 34 for ₹31.8). */
const niceMax = (v: number, step: number) => Math.max(step, Math.ceil((v * 1.05) / step) * step);
/** Bars shorter than this read as "nothing yet" stubs (final/index.html: `v || 3`). */
const STUB = 3;
const perKmText = (v: number) => `₹${v.toFixed(1)}`;
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const word = (n: number) => WORDS[n] ?? String(n);
const dayOf = (key: string) => Number(key.slice(8));

function september(rows: readonly TruckRow[]): SeptemberKpis {
  const s = septemberSummary();
  const wk = septemberWeeks();
  const l7 = last7();
  const behror = stretch("behror");
  const { year, month } = minToISTParts(SEPT_START);
  const monthName = formatDateIST(SEPT_START, "long").split(" ").pop() ?? "";
  const daysInMonth = (istMin(year, month + 1, 1) - istMin(year, month, 1)) / MIN_PER_DAY;
  const known = s.cumulativeL.length;
  const lastKnown = known - 1;
  const incidentDays = [...new Set(s.incidents.map((f) => dayOf(f.dayKey)))].sort((a, b) => a - b);
  const cumulative = Array.from({ length: daysInMonth }, (_, i) => s.cumulativeL[Math.min(i, lastKnown)] ?? 0);
  const yesterdayL = (s.cumulativeL[lastKnown] ?? 0) - (s.cumulativeL[lastKnown - 1] ?? 0);
  const weekLabel = (i: number) => i % 7 === 0 && i < daysInMonth - 2;

  const underLimit = s.wrongPct < WRONG_FLAG_LIMIT_PCT;

  // Profit per km.
  const perKm = rows.map((r) => r.perKm);
  const best = rows[0];
  const worst = rows[rows.length - 1];
  const bottom = rows.slice(-TRUCKS_SHOWN.bottom);
  const dieselPlates = new Set(s.incidents.map((f) => f.plate));
  const bottomFlagged = bottom.filter((r) => dieselPlates.has(r.plate)).length;
  const bottomAllFlagged = bottom.length > 0 && bottomFlagged === bottom.length;

  return {
    month: monthName,
    trips: s.trips,
    range: `${dayOf(s.fromDay)}–${formatDateIST(istMin(year, month, dayOf(s.toDay)), "day-month")}`,
    diesel: {
      litres: s.dieselL,
      inr: s.dieselInr,
      lastWeekL: s.lastWeekL,
      cumulativeL: s.cumulativeL,
      incidentDays,
      behror: { name: behror.name.en, count: s.behror.count, of: s.behror.of },
      chart: {
        values: cumulative.map((v) => v || STUB),
        kinds: cumulative.map((_, i) =>
          i === lastKnown ? "hot" : i > lastKnown ? "hatch" : incidentDays.includes(i + 1) ? "lit" : "dim",
        ),
        labels: cumulative.map((_, i) => (weekLabel(i) || i === daysInMonth - 1 ? i + 1 : null)),
        max: niceMax(s.dieselL, 20),
        bracket: { from: dayOf(l7.fromDay) - 1, to: dayOf(l7.toDay) - 1 },
      },
      ariaLabel:
        `Running total of diesel unaccounted in ${monthName}: ${s.dieselL} litres by ${dayOf(s.toDay)} ${monthName} ` +
        `across ${s.incidents.length} incidents, ${s.lastWeekL} litres of it in the last 7 days, ${yesterdayL} litres yesterday.`,
      footer: [
        { text: "Worth ", bold: formatINR(s.dieselInr) },
        { text: `${behror.name.en} · `, bold: `${s.behror.count} of ${s.behror.of}` },
      ],
    },
    recovered: {
      inr: s.recoveredInr,
      flaggedInr: s.flaggedInr,
      sharePct: s.sharePct,
      weeks: wk.map(({ label, flaggedInr, recoveredInr, bricks }) => ({ label, flaggedInr, recoveredInr, bricks })),
      ariaLabel:
        "Money flagged and recovered by week. " +
        wk
          .map((w, i) => {
            const days = w.label.replace("–", " to ");
            return i === 0
              ? `${days} ${monthName}: ${formatINR(w.flaggedInr)} flagged, ${formatINR(w.recoveredInr)} recovered.`
              : `${days}: ${formatINR(w.flaggedInr)} and ${formatINR(w.recoveredInr)}.`;
          })
          .join(" ") +
        ` Each block is about ${formatINR(BRICK_INR)}.`,
      footer: [{ text: "Flagged ", bold: formatINR(s.flaggedInr) }, { text: "lit = recovered" }],
    },
    wrong: {
      count: s.wrong,
      of: s.flags,
      pct: s.wrongPct,
      limitPct: WRONG_FLAG_LIMIT_PCT,
      confirmed: s.confirmed,
      waiting: s.waiting,
      underLimit,
      groups: [
        { n: s.confirmed, kind: "lit" },
        { n: s.waiting, kind: "hatch" },
        { n: s.wrong, kind: "wrong" },
      ],
      meter: {
        value: s.wrongPct,
        limit: WRONG_FLAG_LIMIT_PCT,
        max: WRONG_FLAG_LIMIT_PCT * 2,
        labels: ["0%", `limit ${WRONG_FLAG_LIMIT_PCT}%`, `${WRONG_FLAG_LIMIT_PCT * 2}%`],
      },
      ariaLabel: wrongAria({
        flags: s.flags,
        confirmed: s.confirmed,
        waiting: s.waiting,
        wrong: s.wrong,
        cleared: s.wrongCleared,
        pct: s.wrongPct,
        month: monthName,
      }),
      footer: wrongFooter(s.wrong, s.wrongCleared, s.waiting),
    },
    perKm: {
      values: perKm,
      best: { perKm: best.perKm, perKmText: perKmText(best.perKm), plate: best.plate, driver: best.driver.en, flags: best.flags },
      bottomAllFlagged,
      chart: {
        values: perKm,
        kinds: perKm.map((_, i) => (i === 0 ? "hot" : i >= perKm.length - TRUCKS_SHOWN.bottom ? "loss" : "dim")),
        labels: perKm.map((_, i) => (i === 0 ? "best" : i === perKm.length - 1 ? "worst" : null)),
        max: niceMax(best.perKm, 2),
      },
      ariaLabel:
        `Profit per km for all ${rows.length} trucks this month, from ${perKmText(best.perKm)} for ${best.plate} ` +
        `down to ${perKmText(worst.perKm)} for ${worst.plate}. ${perKmFlagSentence(bottomFlagged, bottom.length)}`,
      footer: [
        { text: `${best.driver.en} · `, bold: best.flags === 0 ? "no flags" : `${best.flags} ${best.flags === 1 ? "flag" : "flags"}` },
        perKmFlagFooter(bottomFlagged, bottom.length),
      ],
    },
  };
}

// ── Trucks table (TSK-04.1) ──────────────────────────────────────────────
/** Only what the (client) trucks table renders, so the page ships no more than it draws. */
export type TrucksTableRow = Pick<
  TodayTruckRow,
  "rank" | "plate" | "km" | "perKmText" | "barPct" | "tone" | "hidden" | "unaccountedInr" | "unaccountedTone"
> & { driver: string; now: { state: TodayTruckRow["now"]["state"]; label: string } };

export type TrucksTableView = Pick<TodayTrucks, "gapAfterRank" | "gapText" | "period"> & { rows: TrucksTableRow[] };

export function trucksTableView(t: TodayTrucks): TrucksTableView {
  return {
    gapAfterRank: t.gapAfterRank,
    gapText: t.gapText,
    period: t.period,
    rows: t.rows.map((r) => ({
      rank: r.rank,
      plate: r.plate,
      driver: r.driver.en,
      km: r.km,
      perKmText: r.perKmText,
      barPct: r.barPct,
      tone: r.tone,
      hidden: r.hidden,
      unaccountedInr: r.unaccountedInr,
      unaccountedTone: r.unaccountedTone,
      now: { state: r.now.state, label: r.now.label.en },
    })),
  };
}

function trucksTable(rows: readonly TruckRow[], month: string): TodayTrucks {
  const n = rows.length;
  const gap = gapOf(rows);
  const bestPerKm = rows[0]?.perKm ?? 0;
  const lowFrom = n - TRUCKS_SHOWN.bottom + 1;
  return {
    rows: rows.map((r) => {
      const tone = r.rank === 1 ? "top" : r.rank >= lowFrom ? "low" : "mid";
      return {
        ...r,
        hidden: gap.count > 0 && r.rank > TRUCKS_SHOWN.top && r.rank < lowFrom,
        tone,
        barPct: bestPerKm > 0 ? Math.max(0, Math.round((r.perKm / bestPerKm) * 100)) : 0,
        unaccountedTone: r.unaccountedInr === 0 ? "subtle" : tone === "low" ? "loss" : "plain",
        perKmText: perKmText(r.perKm),
      };
    }),
    hiddenRange: gap.range,
    hiddenCount: gap.count,
    gapAfterRank: TRUCKS_SHOWN.top,
    gapText: gap.range
      ? `${gap.count} more ${gap.count === 1 ? "truck" : "trucks"} between ${perKmText(gap.range[0])} and ${perKmText(gap.range[1])} per km`
      : null,
    period: `${month} so far`,
  };
}

/** Today, head to trucks table (§4.6, TSK-02.6 + TSK-04.1). TKT-10 adds the hero and the fleet-now view. */
export function getToday(): TodayPage {
  const head = getTodayHead();
  const y = yesterday();
  const rows = rankedTrucks();
  const sept = september(rows);
  return {
    ...head,
    eyesHead: {
      flaggedTrips: head.verdict.flaggedTrips,
      trips: y.trips,
      inr: y.unaccountedInr,
      countText: eyesCountText(head.verdict.flaggedTrips, y.trips),
    },
    eyes: eyeRows(y.flags),
    cleanLine: { others: y.trips - head.verdict.flaggedTrips, text: cleanLineText(head.verdict.flaggedTrips, y.trips) },
    september: sept,
    trucks: trucksTable(rows, sept.month),
  };
}
