/**
 * The compact fleet JSON the model answers from (technical-plan §6.2), and
 * `allowedNumbers()`, the set of figures an answer may quote. Both the Ask
 * guard and the eval scorer use that set.
 *
 * Everything here is read from the aggregates the screens use, so the model
 * sees the same numbers as Today, the trip pages and the brief. The context is
 * built once per process (`getAskContext`), and the build time is measured
 * (§3.1: optimise only past 300 ms).
 */
import { createHash } from "node:crypto";
import { DEMO_NOW, MIN_PER_DAY, RECONCILED_AT, dayKey } from "@/lib/clock";
import { getDataset } from "@/lib/data";
import {
  SEPT_FIRST_DAY,
  SEPT_LAST_DAY,
  YESTERDAY_DAY,
  days,
  last7,
  ledgerFor,
  routeNormal,
  september,
  stretch,
  truckDiesel,
  trucks,
  weeks,
  yesterday,
} from "@/lib/data/aggregates";
import { truckByPlate } from "@/lib/data/fleet";
import { INTERCITY_ROUTE_IDS, routeName } from "@/lib/data/routes";
import { DIESEL_INR_PER_L, WRONG_FLAG_LIMIT_PCT } from "@/lib/data/constants";
import { formatDateIST, formatTimeIST, minToISTParts } from "@/lib/format";
import { normalisePlate } from "./text";
import { RULE_LABEL, confidenceWord, dayLabel, flagPlace, flagWhen } from "./labels";

export const FLEET_NAME = "Sharma Roadlines";
export const FLEET_BASE = "Jaipur";

type Cell = string | number;

export interface AskContext {
  fleet: {
    name: string;
    owner: string;
    base: string;
    trucks: number;
    dieselInrPerL: number;
    now: string;
    covers: string;
    reconciledAt: string;
    trucksNow: Record<string, number>;
  };
  yesterday: {
    day: string;
    trips: number;
    freightInr: number;
    dieselInr: number;
    tollsInr: number;
    allowanceAndOtherInr: number;
    profitInr: number;
    unaccountedInr: number;
    unaccountedL: number;
    flaggedTrips: string[];
    /** flaggedTrips.length, stated so the model needn't count (Stage 9: EVAL-005 left it out). */
    flaggedTripCount: number;
    tripsThatAddUp: number;
  };
  september: {
    period: string;
    trips: number;
    flags: number;
    confirmed: number;
    waiting: number;
    wrong: number;
    wrongPct: number;
    wrongLimitPct: number;
    flaggedInr: number;
    recoveredInr: number;
    recoveredSharePct: number;
    dieselUnaccounted: { litres: number; inr: number; incidents: number; trips: string[] };
    lastWeek: { from: string; to: string; litres: number; inr: number; tripCount: number; trips: string[] };
    /** Trips whose flags brought money back (recoveredInr sums to `recoveredInr`): what a "recovered" answer cites. */
    recoveredTrips: string[];
    /** Trips whose flags were marked wrong: what a "how often was Urja wrong" answer cites. */
    wrongTrips: string[];
    behrorStretch: { flags: number; dieselLitres: number; dieselInr: number; trips: string[] };
    weeks: { days: string; flaggedInr: number; recoveredInr: number }[];
    dailyProfitInr: Record<string, number>;
  };
  trucks: {
    rank: number;
    plate: string;
    driver: string;
    driverHi: string;
    since: number;
    trips: number;
    km: number;
    perKmInr: number;
    profitInr: number;
    unaccountedInr: number;
    unaccountedL: number;
    flags: number;
    now: string;
  }[];
  flags: {
    id: string;
    trip: string;
    plate: string;
    driver: string;
    rule: string;
    day: string;
    when: string;
    place: string | null;
    litres: number | null;
    inr: number;
    confidence: string;
    whyConfidence?: string;
    status: string;
    recoveredInr: number;
    driverSide: string;
    evidence: string[];
    tripProfitInr: number;
    routeNormalInr: number | null;
  }[];
  routes: Record<string, string>;
  trips: { header: string[]; rows: Cell[][] };
}

const dayMonth = (t: number) => formatDateIST(t, "day-month");
const hhmm = (t: number) => {
  const { hour, minute } = minToISTParts(t);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

/** Builds the context from the aggregates. Pure and deterministic; use `getAskContext()` at runtime. */
export function buildContext(): AskContext {
  const ds = getDataset();
  const y = yesterday();
  const s = september();
  const w = last7();
  const behror = stretch("behror");
  const ranked = trucks();
  const nowCounts: Record<string, number> = { moving: 0, yard: 0, workshop: 0 };
  for (const t of ranked) nowCounts[t.now.state]++;
  // The flags september() sums (lib/data/aggregates.ts septemberFlags: flag day 1–27 Sep).
  const septFlags = ds.flags.filter((f) => f.dayKey >= SEPT_FIRST_DAY && f.dayKey <= SEPT_LAST_DAY);
  const flaggedYesterday = [...new Set(y.flags.filter((f) => f.status !== "wrong").map((f) => f.tripId))];
  const daily: Record<string, number> = {};
  for (const d of days(dayKey(DEMO_NOW - 14 * MIN_PER_DAY), YESTERDAY_DAY)) daily[dayLabel(d.dayKey)] = d.profitInr;

  const routes: Record<string, string> = {};
  for (const id of INTERCITY_ROUTE_IDS) routes[id] = routeName(id).en;
  routes["JAI-LOC-<km>"] = "Jaipur local run (the number is the planned km)";

  return {
    fleet: {
      name: FLEET_NAME,
      owner: "Sharma ji",
      base: FLEET_BASE,
      trucks: ranked.length,
      dieselInrPerL: DIESEL_INR_PER_L,
      now: `${formatDateIST(DEMO_NOW, "weekday-day-month")} 2026, ${formatTimeIST(DEMO_NOW)} IST`,
      covers: `trips that ended ${dayMonth(0)}–${dayLabel(YESTERDAY_DAY)} 2026`,
      reconciledAt: formatTimeIST(RECONCILED_AT),
      trucksNow: nowCounts,
    },
    yesterday: {
      day: formatDateIST(DEMO_NOW - MIN_PER_DAY, "weekday-day-month"),
      trips: y.trips,
      freightInr: y.freightInr,
      dieselInr: y.dieselInr,
      tollsInr: y.tollsInr,
      allowanceAndOtherInr: y.otherInr,
      profitInr: y.profitInr,
      unaccountedInr: y.unaccountedInr,
      unaccountedL: y.unaccountedL,
      flaggedTrips: flaggedYesterday,
      flaggedTripCount: flaggedYesterday.length,
      tripsThatAddUp: y.trips - flaggedYesterday.length,
    },
    september: {
      period: `${Number(SEPT_FIRST_DAY.slice(8))}–${dayLabel(SEPT_LAST_DAY)}`,
      trips: s.trips,
      flags: s.flags,
      confirmed: s.confirmed,
      waiting: s.waiting,
      wrong: s.wrong,
      wrongPct: s.wrongPct,
      wrongLimitPct: WRONG_FLAG_LIMIT_PCT,
      flaggedInr: s.flaggedInr,
      recoveredInr: s.recoveredInr,
      recoveredSharePct: s.sharePct,
      dieselUnaccounted: { litres: s.dieselL, inr: s.dieselInr, incidents: s.incidents.length, trips: s.incidents.map((f) => f.tripId) },
      lastWeek: { from: dayLabel(w.fromDay), to: dayLabel(w.toDay), litres: w.litres, inr: w.inr, tripCount: w.tripIds.length, trips: [...w.tripIds] },
      recoveredTrips: [...new Set(septFlags.filter((f) => f.recoveredInr > 0).map((f) => f.tripId))],
      wrongTrips: [...new Set(septFlags.filter((f) => f.status === "wrong").map((f) => f.tripId))],
      behrorStretch: { flags: behror.flags.length, dieselLitres: behror.litres, dieselInr: behror.inr, trips: behror.flags.map((f) => f.tripId) },
      weeks: weeks().map((k) => ({ days: `${k.label} Sep`, flaggedInr: k.flaggedInr, recoveredInr: k.recoveredInr })),
      dailyProfitInr: daily,
    },
    trucks: ranked.map((t) => ({
      rank: t.rank,
      plate: t.plate,
      driver: t.driver.en,
      driverHi: t.driver.hi,
      since: t.since,
      trips: t.trips,
      km: t.km,
      perKmInr: t.perKm,
      profitInr: t.profitInr,
      unaccountedInr: t.unaccountedInr,
      unaccountedL: truckDiesel(t.plate).litres,
      flags: t.flags,
      now: `${t.now.state} · ${t.now.label.en}`,
    })),
    flags: ds.flags.map((f) => {
      const place = flagPlace(f, "en");
      return {
        id: f.id,
        trip: f.tripId,
        plate: f.plate,
        driver: truckByPlate(f.plate).driver.name.en,
        rule: `${f.rule} · ${RULE_LABEL[f.rule].en}`,
        day: dayLabel(f.dayKey),
        when: flagWhen(f),
        place: place === null ? null : `${place} / ${flagPlace(f, "hi")}`,
        litres: f.litres ?? null,
        inr: f.inr,
        confidence: confidenceWord(f.confidence, "en"),
        // High flags all share one of two stock reasons; the model needs the reason only for Likely and Check.
        ...(f.confidence === "high" ? {} : { whyConfidence: f.whyConfidence.en }),
        status: f.status,
        recoveredInr: f.recoveredInr,
        driverSide: f.driverSide.text ? `${f.driverSide.state}: "${f.driverSide.text.en}"` : f.driverSide.state,
        evidence: f.evidence.map((e) => e.text.en),
        tripProfitInr: ledgerFor(f.tripId).profitInr,
        routeNormalInr: routeNormal(f.tripId)?.normalInr ?? null,
      };
    }),
    routes,
    trips: {
      // A trip's flags are in `flags` (by trip id), not repeated here, to keep the context under 40 KB.
      header: ["id", "plate", "route", "start", "end", "km", "freightInr", "profitInr"],
      rows: ds.trips.map((t) => {
        const l = ledgerFor(t.id);
        return [
          t.id,
          t.plate,
          t.routeId,
          `${dayMonth(t.start)} ${hhmm(t.start)}`,
          `${dayMonth(t.end)} ${hhmm(t.end)}`,
          Math.round(t.actualKm),
          l.freightInr,
          l.profitInr,
        ];
      }),
    },
  };
}

// ── Allowed numbers ──────────────────────────────────────────────────────
const NUMBER_IN_TEXT = /\d[\d,]*(?:\.\d+)?/g;
const TIME_IN_TEXT = /\b(\d{1,2}):(\d{2})\b/g;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Every number in a text, with Indian grouping commas removed ('₹1,86,400' → 186400). */
export function numbersInText(text: string): number[] {
  return (text.match(NUMBER_IN_TEXT) ?? []).map((m) => Number(m.replace(/,/g, ""))).filter(Number.isFinite);
}

/**
 * Every number in the context JSON, plus date parts (day, month number, year)
 * and times (hour in 24 h and 12 h form, minute). Numbers inside strings count
 * too, so evidence lines such as 'Bill says 250 L' allow 250.
 */
export function allowedNumbers(ctx: AskContext): Set<number> {
  const out = new Set<number>([2026]);
  const addText = (s: string) => {
    for (const n of numbersInText(s)) out.add(n);
    for (const m of s.matchAll(TIME_IN_TEXT)) {
      const h = Number(m[1]);
      out.add(h);
      out.add(h % 12 === 0 ? 12 : h % 12);
      out.add(Number(m[2]));
    }
    MONTHS.forEach((mon, i) => {
      if (new RegExp(`\\b${mon}\\b`).test(s)) out.add(i + 1);
    });
  };
  const walk = (v: unknown): void => {
    if (typeof v === "number") out.add(v);
    else if (typeof v === "string") addText(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        addText(k);
        walk(x);
      }
  };
  walk(ctx);
  return out;
}

// ── Per-process memo ─────────────────────────────────────────────────────
export interface AskContextBundle {
  context: AskContext;
  /** `JSON.stringify(context)`: what the model receives. */
  json: string;
  allowed: Set<number>;
  /** The first 12 hex of SHA-256(json): provenance's datasetHash. */
  hash: string;
  /** '212 trips across 24 trucks, 1–27 Sep': provenance's scope. */
  scope: string;
  /** How long the first build took (dataset + context), in ms. */
  buildMs: number;
  tripIds: Set<string>;
  /** The fleet's plates, normalised ('RJ14GC7710'): a truck the guard accepts as a citation. */
  plates: Set<string>;
}

let memo: AskContextBundle | undefined;

/** The context for this process: built on first use, then reused. */
export function getAskContext(): AskContextBundle {
  if (memo) return memo;
  const t0 = performance.now();
  const context = buildContext();
  const json = JSON.stringify(context);
  memo = {
    context,
    json,
    allowed: allowedNumbers(context),
    hash: createHash("sha256").update(json).digest("hex").slice(0, 12),
    scope: `${context.september.trips} trips across ${context.fleet.trucks} trucks, ${context.september.period}`,
    buildMs: Math.round(performance.now() - t0),
    tripIds: new Set(getDataset().trips.map((t) => t.id)),
    plates: new Set(context.trucks.map((t) => normalisePlate(t.plate))),
  };
  return memo;
}
