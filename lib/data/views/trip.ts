/**
 * The Trip evidence view model (technical-plan §4.6, TSK-05.1–05.5).
 * Components under components/trip/ render these fields and nothing else:
 * every ₹, litre, time and chart point on /trips/[tripId] is computed here
 * from the trip's telemetry, its flags and its ledger.
 *
 * - Pages exist for every finished trip and for the 11 still on the road at
 *   DEMO_NOW (`status: 'live'`); a live trip has no profit, flag or ledger
 *   yet and says so.
 * - The flag card shows the trip's primary flag (eye order: confidence, then
 *   ₹). A clean trip gets "Every check passed" with the checks it passed.
 * - Chart series are sampled from the per-minute telemetry: every 5 min on
 *   the desktop and every 10 min on the phone for trips up to 10 hours;
 *   longer trips widen the step so the chart keeps about 115 bars.
 * - The rule variants follow §5.4: R1 shades the drop, R2 the refuel stop,
 *   R3 draws this truck's normal use, R4 leaves the chart alone (the map
 *   carries it), R5 adds a claims vs FASTag table.
 */
import { DEMO_NOW } from "@/lib/clock";
import { formatDateIST, formatINR, formatLitres, formatTimeIST, minToISTParts } from "@/lib/format";
import { SHELL } from "@/lib/site-shell";
import { flagsForTrip, ledgerFor, routeNormal as routeNormalOf, yesterday } from "../aggregates";
import { DIESEL_INR_PER_L, r2Fires } from "../constants";
import { baselineClFor, truckByPlate } from "../fleet";
import { distanceToPathM } from "../geo";
import { getDataset, type DeepReadonly, type ReadonlyFlag, type ReadonlyTrip } from "../index";
import { placeById } from "../places";
import { isLocalRoute, routeById, routeName } from "../routes";
import { tankUsedCl } from "../rules/r3-excess";
import { measureDeviation } from "../rules/r4-route";
import { smoothFuelCl } from "../rules/signal";
import type { ScenarioStop } from "../scenario/schema";
import { REFUEL_RAMP_MIN } from "../simulate";
import type { Confidence, Evidence, FlagStatus, LngLat, Min, Plate, RuleId, Trip, TripId } from "../types";

// ── Contract ─────────────────────────────────────────────────────────────
/** Icons the view asks for; every one is in components/ui/IconSprite. */
export type TripIcon = "drop" | "clock" | "pin" | "route" | "receipt" | "rupee" | "truck" | "check";

export interface TripHeadView {
  plate: Plate;
  /** The h1: 'Jaipur → Delhi (Okhla)'. */
  route: string;
  meta: string;
  result:
    | { kind: "profit"; profitInr: number; vs: VsLine }
    | { kind: "live"; label: string; note: string };
}

/** "₹3,420 below this route’s normal of ₹16,660": the chip, then the rest. */
export interface VsLine {
  chip: { text: string; tone: "loss" | "gain" } | null;
  text: string;
  sentence: string;
}

export interface EvidenceLine {
  text: string;
  source: Evidence["source"];
  icon: TripIcon;
}

export interface DriverSideView {
  chip: { text: string; tone?: "wait" | "ok" };
  quote: { who: string; text: string } | null;
  /** The two honest prototype actions; null once the flag is resolved. */
  actions: { ask: string; explain: string; asked: string; explained: string } | null;
  /** The fine print under the actions (what the driver would get). */
  message: string | null;
}

export interface FlagView {
  id: string;
  rule: RuleId;
  ruleName: string;
  confidence: Confidence;
  /** Appended to the confidence word: 'High confidence'. */
  confidenceSuffix: string;
  status: FlagStatus;
  title: string;
  inr: number;
  amtNote: string;
  evidence: EvidenceLine[];
  why: { label: string; text: string };
  driverSide: DriverSideView;
}

export type TripCard =
  | { kind: "flag"; flag: FlagView }
  | { kind: "clean"; chip: string; title: string; label: string; checks: EvidenceLine[] }
  | { kind: "live"; chip: string; title: string; text: string };

export interface DriverView {
  name: string;
  first: string;
  initials: string;
  since: string;
  call: string;
  message: string;
  /** Shown whenever a prototype action is used: nothing is ever sent. */
  note: string;
}

export type WaveKind = "flag" | "fuel" | "move";

export interface WaveNoteView {
  i: number;
  y: number;
  a?: "start" | "middle" | "end";
  text: string;
  tone?: "loss";
  fs: number;
}

export interface WaveSeries {
  /** Minutes per bar. */
  step: number;
  fuel: number[];
  speed: number[];
  kind: WaveKind[];
  window?: [number, number];
  expected?: [number, number][];
  notes: WaveNoteView[];
  times: { i: number; text: string }[];
  max: number;
  ticks: number[];
  w?: number;
  h: number;
  gap?: number;
  fs?: number;
}

export interface TollTable {
  rows: { plaza: string; time: string; inr: number }[];
  fastagInr: number;
  claimedInr: number;
  diffInr: number;
}

export interface ChartView {
  count: string;
  legend: { text: string; swatch: "fuel" | "loss" | "refuel" | "dash" }[];
  desk: WaveSeries;
  phone: WaveSeries;
  /** The desktop chart's aria-label: the whole story in words. */
  label: string;
  /** The phone chart's shorter aria-label. */
  phoneLabel: string;
  note: string | null;
  tolls: TollTable | null;
}

export interface TimelineEvent {
  /** Minute of the event (for ordering); `t` is its display time. */
  at: Min;
  t: string;
  dot: "lamp" | "ok" | "bad" | "";
  text: string;
  small?: string;
  v?: string;
  vTone?: "loss";
  flag: boolean;
}

export type LedgerRowKind = "row" | "unaccounted" | "total";
export interface LedgerRow {
  label: string;
  inr: number;
  kind: LedgerRowKind;
}

export type TripLedgerView =
  | { kind: "done"; rows: LedgerRow[] }
  | { kind: "live"; rows: LedgerRow[]; note: string };

export type RouteNormalView =
  | {
      kind: "chart";
      normalInr: number;
      values: number[];
      kinds: ("dim" | "loss" | "lit")[];
      max: number;
      caption: string;
      refText: string;
      label: string;
    }
  | { kind: "none"; text: string };

export type RailSegState = "move" | "stop" | "flag" | "fuel";
export interface RailView {
  head: string;
  key: string;
  total: number;
  step: number;
  segs: { from: number; to: number; s: RailSegState }[];
  knob?: { t: number; label: string };
  ends: [string, string];
}

export interface TripMapSlotView {
  routeName: string;
  legend: { cls: "dash" | "solid" | "dl" | "dk"; text: string }[];
}

export interface TripView {
  id: TripId;
  status: "done" | "live";
  title: string;
  crumbs: { viaEyes: boolean; current: string };
  head: TripHeadView;
  card: TripCard;
  driver: DriverView;
  map: TripMapSlotView;
  rail: RailView;
  chart: ChartView;
  timeline: TimelineEvent[];
  ledger: TripLedgerView;
  routeNormal: RouteNormalView;
}

// ── Lookup ───────────────────────────────────────────────────────────────
type Flag = ReadonlyFlag;
type TripR = ReadonlyTrip;
type Stop = DeepReadonly<ScenarioStop>;

/** Every trip that has a page: finished trips, then the ones still on the road. */
export function getTripIds(): TripId[] {
  const ds = getDataset();
  return [...ds.trips, ...ds.live].map((t) => t.id);
}

/** The first of yesterday's flagged trips in eye order (where /trips lands). */
export function topFlaggedTripId(): TripId {
  const f = yesterday().flags.find((x) => x.status !== "wrong");
  if (!f) throw new Error("No flagged trip yesterday");
  return f.tripId;
}

const cache = new Map<TripId, TripView>();

/** The Trip view for a known id; null for anything else (the page shows its 404). */
export function getTripView(tripId: string): TripView | null {
  const hit = cache.get(tripId);
  if (hit) return hit;
  const ds = getDataset();
  const done = ds.trips.find((t) => t.id === tripId);
  const trip = done ?? ds.live.find((t) => t.id === tripId);
  if (!trip) return null;
  const v = build(trip, done ? "done" : "live");
  cache.set(tripId, v);
  return v;
}

// ── Small helpers ────────────────────────────────────────────────────────
/** Rules read the frozen dataset without changing it; they are typed for plain trips. */
const asTrip = (t: TripR) => t as unknown as Trip;
const lngLat = (p: readonly [number, number]): LngLat => [p[0], p[1]];
const inr = (n: number) => formatINR(n, { sign: "never" });
const neg = (n: number) => (n === 0 ? 0 : -n);
const L = (cl: number) => Math.round(cl / 100);
const km1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const time = formatTimeIST;
const dayMonth = (t: Min) => formatDateIST(t, "day-month");
/** Lower-cases a leading capital after "Why high:", but leaves acronyms ("FASTag", "GPS") alone. */
const lcFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

/** '9 PM', '12 AM'. */
function hourLabel(t: Min): string {
  const { hour } = minToISTParts(t);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${hour < 12 ? "AM" : "PM"}`;
}

/** '2:14 and 2:40 AM', or '11:50 PM and 12:30 AM'. */
function andRange(a: Min, b: Min): string {
  const [xt, xm] = time(a).split(" ");
  const [yt, ym] = time(b).split(" ");
  return xm === ym ? `${xt} and ${yt} ${ym}` : `${time(a)} and ${time(b)}`;
}

/** '50 min', '4 h 30 min', '5 h'. */
function duration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** The city a route end is in, as the mockup names routes: 'Okhla, Delhi' → 'Delhi'. */
const cityOf = (id: string) => {
  const name = placeById(id).name.en.replace(/ Transport Nagar$/, "");
  return name.includes(", ") ? name.split(", ")[1] : name;
};

/** 'Okhla, Delhi' → 'Okhla'; 'Jaipur Transport Nagar' → 'Jaipur'. */
const shortPlace = (id: string) => placeById(id).name.en.replace(/ Transport Nagar$/, "").split(",")[0];

const RULE_NAME: Record<RuleId, string> = {
  R1: "Stationary fuel drop",
  R2: "Refuel mismatch",
  R3: "Excess consumption",
  R4: "Route deviation",
  R5: "Toll mismatch",
};

const RULE_FLAGGED: Record<RuleId, string> = {
  R1: "stationary fuel drop",
  R2: "refuel mismatch",
  R3: "excess consumption",
  R4: "route deviation",
  R5: "toll mismatch",
};

const CONF_WORD: Record<Confidence, string> = { high: "High", likely: "Likely", check: "Check" };

const SOURCE_ICON: Record<Evidence["source"], TripIcon> = {
  "Fuel sensor": "drop",
  "GPS · ignition": "clock",
  Geofence: "pin",
  "Fleet history": "route",
  "Fuel bill": "receipt",
  FASTag: "rupee",
  "Trip plan": "truck",
};

/** A run of zero-speed samples, [i0, i1] inclusive. */
interface Run {
  i0: number;
  i1: number;
}

function zeroRuns(trip: TripR, minLen: number): Run[] {
  const s = trip.samples;
  const out: Run[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i].speedKmh !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < s.length && s[j + 1].speedKmh === 0) j++;
    if (j - i + 1 >= minLen) out.push({ i0: i, i1: j });
    i = j + 1;
  }
  return out;
}

function runAt(trip: TripR, t: Min): Run | null {
  const i = t - trip.start;
  const s = trip.samples;
  if (i < 0 || i >= s.length || s[i].speedKmh !== 0) return null;
  let i0 = i;
  let i1 = i;
  while (i0 > 0 && s[i0 - 1].speedKmh === 0) i0--;
  while (i1 + 1 < s.length && s[i1 + 1].speedKmh === 0) i1++;
  return { i0, i1 };
}

// ── Build ────────────────────────────────────────────────────────────────
interface Ctx {
  trip: TripR;
  status: "done" | "live";
  flag: Flag | null;
  flags: Flag[];
  first: string;
  /** Minutes covered by samples: end − start, or up to DEMO_NOW for a live trip. */
  span: number;
  lastT: Min;
  local: boolean;
  road: string;
  stops: readonly Stop[];
}

function build(trip: TripR, status: "done" | "live"): TripView {
  const truck = truckByPlate(trip.plate);
  const flags = status === "done" ? flagsForTrip(trip.id) : [];
  const lastT = trip.samples[trip.samples.length - 1].t;
  const local = isLocalRoute(trip.routeId);
  const scenarioTrip = getDataset().scenario.trips.find((s) => s.id === trip.id);
  const ctx: Ctx = {
    trip,
    status,
    flag: flags[0] ?? null,
    flags,
    first: truck.driver.name.en.split(" ")[0],
    span: lastT - trip.start,
    lastT,
    local,
    road: local ? "the planned route" : "NH48",
    stops: (scenarioTrip?.stops ?? []).filter((s) => s.from <= lastT),
  };
  const name = truck.driver.name.en;
  const words = name.split(" ");
  const driver: DriverView = {
    name,
    first: ctx.first,
    initials: `${words[0][0]}${words[words.length - 1][0]}`,
    since: `Driver · with ${SHELL.fleetName} since ${truck.driver.since}`,
    call: `Call ${ctx.first}`,
    message: `Message ${ctx.first}`,
    note: `Prototype: no message was sent. In Urja this goes to ${ctx.first} on WhatsApp.`,
  };
  const eyes = new Set(yesterday().flags.filter((f) => f.status !== "wrong").map((f) => f.tripId));
  return {
    id: trip.id,
    status,
    title: `Trip ${trip.id} · Urja — ${SHELL.fleetName}`,
    crumbs: { viaEyes: eyes.has(trip.id), current: `Trip ${trip.id}` },
    head: head(ctx, name),
    card: card(ctx),
    driver,
    map: mapSlot(ctx),
    rail: rail(ctx),
    chart: chart(ctx),
    timeline: timeline(ctx),
    ledger: ledger(ctx),
    routeNormal: routeNormalView(ctx),
  };
}

// ── Head ─────────────────────────────────────────────────────────────────
function head(ctx: Ctx, driverName: string): TripHeadView {
  const { trip } = ctx;
  const route = routeById(trip.routeId);
  const load = `${trip.loadT} t ${trip.cargo.en}`;
  const startTxt = `${formatDateIST(trip.start, "weekday-day-month")}, ${time(trip.start)}`;
  if (ctx.status === "live") {
    return {
      plate: trip.plate,
      route: routeName(trip.routeId).en,
      meta: `Left ${startTxt} · on the road at ${time(DEMO_NOW)} · ${grouped.format(route.plannedKm)} km planned · ${load} · Driver ${driverName}`,
      result: { kind: "live", label: "On the road", note: "Profit is worked out when the trip arrives" },
    };
  }
  const sameDay = formatDateIST(trip.start, "weekday-day-month") === formatDateIST(trip.end, "weekday-day-month");
  const endTxt = sameDay ? time(trip.end) : `${formatDateIST(trip.end, "weekday-day-month")}, ${time(trip.end)}`;
  const km = grouped.format(Math.round(trip.actualKm));
  const where = ctx.local ? `${km} km around Jaipur` : `${km} km on NH48`;
  const profitInr = ledgerFor(trip.id).profitInr;
  const rn = routeNormalOf(trip.id);
  let vs: VsLine;
  if (!rn) {
    const text = "No earlier clean trip on this route yet, so there’s no normal to compare";
    vs = { chip: null, text, sentence: text };
  } else {
    const d = profitInr - rn.normalInr;
    const text = `this route’s normal of ${inr(rn.normalInr)}`;
    if (d === 0) {
      const t = `Level with ${text}`;
      vs = { chip: null, text: t, sentence: t };
    } else {
      const chip = { text: `${inr(Math.abs(d))} ${d < 0 ? "below" : "above"}`, tone: d < 0 ? ("loss" as const) : ("gain" as const) };
      vs = { chip, text, sentence: `${chip.text} ${text}` };
    }
  }
  return {
    plate: trip.plate,
    route: routeName(trip.routeId).en,
    meta: `${startTxt} → ${endTxt} · ${where} · ${load} · Driver ${driverName}`,
    result: { kind: "profit", profitInr, vs },
  };
}

// ── Flag card ────────────────────────────────────────────────────────────
function refuelAt(trip: TripR, t: Min) {
  return trip.refuels.find((r) => r.t === t) ?? null;
}

/** used and normal litres for R3's copy: normal is the truck's baseline; used = normal + the flagged excess. */
function r3Litres(trip: TripR, flag: Flag) {
  const normal = L(baselineClFor(truckByPlate(trip.plate), trip.routeId));
  return { used: normal + (flag.litres ?? 0), normal };
}

function extraKm(trip: TripR): number {
  const dev = measureDeviation(asTrip(trip));
  return dev ? dev.extraKm : trip.actualKm - routeById(trip.routeId).plannedKm;
}

function neutralAsk(ctx: Ctx, f: Flag): string {
  const { trip } = ctx;
  switch (f.rule) {
    case "R1": {
      const near = f.placeId ? ` near ${placeById(f.placeId).name.en}` : " while parked";
      return `Fuel dropped ${f.litres} L${near} at ${time(f.at)} on ${dayMonth(f.at)}.`;
    }
    case "R2": {
      const bill = refuelAt(trip, f.at);
      const pump = f.placeId ? placeById(f.placeId).name.en : "the pump";
      const billed = bill ? L(bill.billedCl) : 0;
      const rise = bill ? L(bill.tankRiseCl) : 0;
      return `The fuel bill at ${pump} on ${dayMonth(f.at)} says ${billed} L, but the tank rose ${rise} L.`;
    }
    case "R3": {
      const { used, normal } = r3Litres(trip, f);
      return `This trip used ${used} L of diesel; this truck usually uses ${normal} L on this route.`;
    }
    case "R4":
      return `This trip ran ${grouped.format(Math.round(trip.actualKm))} km against a planned ${grouped.format(routeById(trip.routeId).plannedKm)} km.`;
    case "R5":
      return `The toll claim is ${inr(f.inr)} more than FASTag shows.`;
  }
}

function driverSide(ctx: Ctx, f: Flag): DriverSideView {
  const first = ctx.first;
  const says = (text: string) => ({ who: `${first} says:`, text: `“${text}”` });
  const actions = {
    ask: `Ask ${first} on WhatsApp`,
    explain: "Mark as explained",
    asked: `Asked · waiting for ${first}`,
    explained: "Explained · you decide",
  };
  const ds = f.driverSide;
  if (f.status === "waiting") {
    if (ds.state === "replied" && ds.text) {
      return {
        chip: { text: `${first} explained · review`, tone: "wait" },
        quote: says(ds.text.en),
        actions,
        message: `${first} replied on WhatsApp. Nothing is deducted until you decide.`,
      };
    }
    return {
      chip: { text: `${first} hasn’t been asked yet` },
      quote: null,
      actions,
      message: `${first} gets a neutral message: “${neutralAsk(ctx, f)} Can you tell us what happened?” Nothing is deducted until you decide.`,
    };
  }
  const quote = ds.text ? (ds.state === "replied" || ds.state === "cleared" ? says(ds.text.en) : { who: "Note:", text: ds.text.en }) : null;
  if (f.status === "wrong") {
    return { chip: { text: "Marked wrong · you accepted the driver’s side", tone: "ok" }, quote, actions: null, message: null };
  }
  const recovered = f.recoveredInr > 0 ? ` · ${inr(f.recoveredInr)} recovered` : "";
  return { chip: { text: `Confirmed${recovered}` }, quote, actions: null, message: null };
}

function flagView(ctx: Ctx, f: Flag): FlagView {
  const { trip } = ctx;
  const perL = `at ${inr(DIESEL_INR_PER_L)} / L`;
  let title: string;
  let amtNote = perL;
  switch (f.rule) {
    case "R1":
    case "R2":
      title = `${f.litres} L diesel unaccounted`;
      break;
    case "R3":
      title = `Used ${f.litres} L more diesel than usual`;
      break;
    case "R4":
      title = `${Math.round(extraKm(trip))} extra km off route`;
      amtNote = "diesel for the extra km";
      break;
    case "R5":
      title = "Toll claim doesn’t match FASTag";
      amtNote = "claimed above FASTag";
      break;
  }
  const whyText = lcFirst(f.whyConfidence.en.replace(/^(Check|Capped at Likely): /, ""));
  return {
    id: f.id,
    rule: f.rule,
    ruleName: RULE_NAME[f.rule],
    confidence: f.confidence,
    confidenceSuffix: f.confidence === "high" ? " confidence" : "",
    status: f.status,
    title,
    inr: f.inr,
    amtNote,
    evidence: f.evidence.map((e) => ({ text: e.text.en, source: e.source, icon: SOURCE_ICON[e.source] })),
    why: { label: `Why ${CONF_WORD[f.confidence].toLowerCase()}:`, text: whyText },
    driverSide: driverSide(ctx, f),
  };
}

function card(ctx: Ctx): TripCard {
  const { trip } = ctx;
  if (ctx.status === "live") {
    return {
      kind: "live",
      chip: "On the road",
      title: "Still on the road",
      text: `Urja checks this trip against fuel, FASTag and GPS once it arrives. Nothing is flagged yet; the last reading was at ${time(ctx.lastT)}.`,
    };
  }
  if (ctx.flag) return { kind: "flag", flag: flagView(ctx, ctx.flag) };
  const route = routeById(trip.routeId);
  const n = trip.refuels.length;
  const fastag = trip.fastag.reduce((a, e) => a + e.inr, 0);
  const claim = trip.claims.tollsInr;
  const used = L(tankUsedCl(asTrip(trip)));
  const base = L(baselineClFor(truckByPlate(trip.plate), trip.routeId));
  const check = (text: string, source: Evidence["source"]): EvidenceLine => ({ text, source, icon: "check" });
  return {
    kind: "clean",
    chip: "No flags",
    title: "Every check passed",
    label: "What Urja checked",
    checks: [
      check("No fuel drop while parked or at a stop", "Fuel sensor"),
      check(n === 0 ? "No refuel on this trip" : n === 1 ? "The fuel bill matches the tank rise" : `All ${n} fuel bills match the tank rise`, "Fuel bill"),
      check(`Used ${used} L; this truck’s normal on this route is ${base} L`, "Fleet history"),
      check(`Drove ${grouped.format(Math.round(trip.actualKm))} km against a planned ${grouped.format(route.plannedKm)} km`, "Trip plan"),
      check(
        trip.fastag.length === 0 && claim === 0
          ? "No tolls on this route"
          : claim === fastag
            ? `Toll claim ${inr(claim)} matches FASTag`
            : `Toll claim ${inr(claim)}; FASTag shows ${inr(fastag)}`,
        "FASTag",
      ),
    ],
  };
}

// ── Map slot and rail ────────────────────────────────────────────────────
function mapSlot(ctx: Ctx): TripMapSlotView {
  const legend: TripMapSlotView["legend"] = [
    { cls: "dash", text: ctx.local ? "Planned route" : "Planned · NH48" },
    { cls: "solid", text: "Actual" },
  ];
  const r = ctx.flag?.rule;
  if (r === "R1") legend.push({ cls: "dl", text: "Fuel drop" });
  if (r === "R2") legend.push({ cls: "dl", text: "Short refuel" });
  if (r === "R4") legend.push({ cls: "dl", text: "Off route" });
  legend.push({ cls: "dk", text: "Checked stop" });
  return { routeName: routeName(ctx.trip.routeId).en, legend };
}

function railHead(trip: TripR, lastT: Min): string {
  const a = minToISTParts(trip.start);
  const b = minToISTParts(lastT);
  if (a.day === b.day && a.month === b.month) return formatDateIST(trip.start, "weekday-day-month");
  const [da, ma] = dayMonth(trip.start).split(" ");
  const [db, mb] = dayMonth(lastT).split(" ");
  const span = ma === mb ? `${da}–${db} ${mb}` : `${da} ${ma} – ${db} ${mb}`;
  return a.hour >= 18 && lastT - trip.start <= 16 * 60 ? `Night of ${span}` : span;
}

function rampRel(trip: TripR, t: Min): [number, number] {
  return [t + 1 - trip.start, t + 1 + REFUEL_RAMP_MIN - trip.start];
}

function rail(ctx: Ctx): RailView {
  const { trip, flag } = ctx;
  const step = ctx.span <= 600 ? 5 : ctx.span <= 1200 ? 10 : 20;
  const segs: RailView["segs"] = [];
  let knob: RailView["knob"];
  const keys = ["moving", "stopped"];
  if (flag?.rule === "R1") {
    segs.push({ from: flag.at - trip.start, to: (flag.until ?? flag.at) - trip.start, s: "flag" });
    knob = { t: flag.at - trip.start, label: `${time(flag.at)} · −${flag.litres} L` };
    keys.push("the flagged stop");
  } else if (flag?.rule === "R2") {
    const run = runAt(trip, flag.at);
    segs.push(run ? { from: run.i0, to: run.i1, s: "flag" } : { from: flag.at - trip.start, to: flag.at - trip.start, s: "flag" });
    knob = { t: flag.at - trip.start, label: `${time(flag.at)} · bill ≠ tank` };
    keys.push("the flagged refuel");
  } else if (flag?.rule === "R4" && flag.at !== trip.start) {
    segs.push({ from: flag.at - trip.start, to: (flag.until ?? flag.at) - trip.start, s: "flag" });
    knob = { t: flag.at - trip.start, label: `${time(flag.at)} · +${Math.round(extraKm(trip))} km` };
    keys.push("off route");
  }
  for (const r of trip.refuels) {
    const [a, b] = rampRel(trip, r.t);
    segs.push({ from: a, to: b, s: "fuel" });
  }
  if (trip.refuels.length) keys.push("refuel");
  for (const run of zeroRuns(trip, 3)) segs.push({ from: run.i0, to: run.i1, s: "stop" });
  const endLabel = ctx.status === "live" ? `${time(ctx.lastT)} · on the road` : `${time(trip.end)} · ${shortPlace(routeById(trip.routeId).to)}`;
  const view: RailView = {
    head: railHead(trip, ctx.lastT),
    key: keys.join(" · "),
    total: ctx.span,
    step,
    segs,
    ends: [`${time(trip.start)} · ${shortPlace(routeById(trip.routeId).from)}`, endLabel],
  };
  if (knob) view.knob = knob;
  return view;
}

// ── Fuel and speed chart ─────────────────────────────────────────────────
const DESK = { h: 300, noteLift: 35, refuelLift: 37, stopLift: 18 } as const;
const PHONE = { w: 360, h: 250, gap: 1.2, fs: 12, noteLift: 28, refuelLift: 33 } as const;
const MAX_BARS = 115;
/** Wave's defaults (components/charts/Wave.tsx): viewBox width, bar gap and the left gutter. */
const WAVE_W = 1000;
const WAVE_GAP = 1.6;
const WAVE_X0 = 44;
/** SVG units between a note's baseline and the highest mark under it. */
const NOTE_CLEAR = 10;

/** A generous width for a note in Inter at `fs` (about 0.6 em a character), so it errs on the clear side. */
function noteWidth(text: string, fs: number): number {
  return text.length * fs * 0.6;
}

/** Where a bar of `litres` tops out, in SVG y (Wave's geometry: axis at 64% of the height). */
function barTop(litres: number, h: number, max: number): number {
  const axis = h * 0.64;
  return axis - (litres / max) * (axis - 20);
}

/** Litres unaccounted up to minute t (drives the dashed "expected" line). */
function lostSoFar(ctx: Ctx, t: Min, kmFrac: (t: Min) => number): number {
  const f = ctx.flag;
  if (!f) return 0;
  const litres = f.litres ?? 0;
  if (f.rule === "R1") {
    const until = f.until ?? f.at;
    return until > f.at ? litres * clamp01((t - f.at) / (until - f.at)) : t >= f.at ? litres : 0;
  }
  if (f.rule === "R2") return litres * clamp01((t - (f.at + 1)) / REFUEL_RAMP_MIN);
  if (f.rule === "R3") return litres * kmFrac(t);
  return 0;
}

function hasExpected(f: Flag | null): boolean {
  return f !== null && (f.rule === "R1" || f.rule === "R2" || f.rule === "R3");
}

function series(ctx: Ctx, step: number, phone: boolean, kmFrac: (t: Min) => number): Omit<WaveSeries, "max" | "ticks" | "notes"> & { notesAt: (max: number) => WaveNoteView[] } {
  const { trip, flag } = ctx;
  const s = trip.samples;
  // The last bar is always the last reading, even when the span isn't a whole number of steps.
  const n = Math.ceil(ctx.span / step) + 1;
  const minuteOf = (i: number) => Math.min(i * step, s.length - 1);
  const fuel: number[] = [];
  const speed: number[] = [];
  const kind: WaveKind[] = [];
  for (let i = 0; i < n; i++) {
    const sm = s[minuteOf(i)];
    fuel.push(Math.round(sm.fuelCl / 10) / 10);
    speed.push(sm.speedKmh);
    kind.push("move");
  }
  const idx = (t: Min) => (t - trip.start) / step;
  const clampI = (i: number) => Math.max(0, Math.min(n - 1, i));

  // Refuel ramps glow; at least one bar per refuel.
  for (const r of trip.refuels) {
    const [a, b] = rampRel(trip, r.t);
    let any = false;
    for (let i = Math.ceil(a / step); i <= Math.floor(b / step) && i < n; i++) {
      kind[i] = "fuel";
      any = true;
    }
    if (!any) kind[clampI(Math.round((a + b) / 2 / step))] = "fuel";
  }

  let window: [number, number] | undefined;
  if (flag?.rule === "R1") {
    const until = flag.until ?? flag.at;
    let a = Math.ceil(idx(flag.at));
    const b = Math.floor(idx(until));
    if (a > b) a = Math.min(b, Math.round(idx(flag.at)));
    window = [clampI(a), clampI(Math.max(a, b))];
    for (let i = window[0]; i <= window[1]; i++) kind[i] = "flag";
  } else if (flag?.rule === "R2") {
    const run = runAt(trip, flag.at);
    const from = run ? run.i0 : flag.at - trip.start;
    const to = run ? run.i1 : flag.at - trip.start;
    let a = Math.ceil(from / step);
    const b = Math.floor(to / step);
    if (a > b) a = b;
    window = [clampI(a), clampI(b)];
  }

  let expected: [number, number][] | undefined;
  if (hasExpected(flag)) {
    const startI = flag!.rule === "R3" ? 0 : window ? window[0] : 0;
    expected = [];
    for (let i = startI; i < n; i++) {
      const t = trip.start + minuteOf(i);
      expected.push([i, Math.round((fuel[i] + lostSoFar(ctx, t, kmFrac)) * 10) / 10]);
    }
  }

  const geo = phone ? PHONE : DESK;
  const notesAt = (max: number): WaveNoteView[] => {
    const top = (litres: number) => barTop(litres, geo.h, max);
    const notes: WaveNoteView[] = [];
    const fs = phone ? PHONE.fs : 12;
    if (flag?.rule === "R1" && window) {
      const i = Math.max(0, window[0] - 1);
      const y = Math.max(12, Math.round(top(fuel[i]) - geo.noteLift));
      const until = flag.until ?? flag.at;
      notes.push({ i, y, a: "end", text: phone ? `−${flag.litres} L, parked` : `−${flag.litres} L in ${until - flag.at} min`, tone: "loss", fs: 13 });
      if (!phone) notes.push({ i, y: y + 17, a: "end", text: "parked, ignition off", fs: 12 });
    } else if (flag?.rule === "R2" && window) {
      const bill = refuelAt(trip, flag.at);
      const i = Math.max(0, window[0] - 1);
      const y = Math.max(12, Math.round(top(Math.max(...fuel.slice(window[0], Math.min(n, window[1] + 3)))) - geo.noteLift));
      const text = `bill ${bill ? L(bill.billedCl) : 0} L · tank +${bill ? L(bill.tankRiseCl) : 0} L`;
      notes.push({ i, y, a: "end", text, tone: "loss", fs: 13 });
    } else if (flag?.rule === "R3") {
      const { used, normal } = r3Litres(trip, flag);
      const text = `used ${used} L · normal ${normal} L`;
      // DES-11: clear of the dashed line and the bars under the note's whole width, not only at its
      // end; the line climbs to the left, so measured at the end alone it struck through the text.
      const w = phone ? PHONE.w : WAVE_W;
      const gap = phone ? PHONE.gap : WAVE_GAP;
      const pitch = (w - WAVE_X0 - gap * (n - 1)) / n + gap;
      const from = Math.max(0, n - 1 - Math.ceil(noteWidth(text, 13) / pitch));
      const exp = new Map(expected ?? []);
      let peak = 0;
      for (let i = from; i < n; i++) peak = Math.max(peak, fuel[i], exp.get(i) ?? 0);
      const y = Math.max(12, Math.round(top(peak) - NOTE_CLEAR));
      notes.push({ i: n - 1, y, a: "end", text, tone: "loss", fs: 13 });
    }
    // Refuels whose bill matches the tank rise.
    for (const r of trip.refuels) {
      if (flag?.rule === "R2" && r.t === flag.at) continue;
      if (r2Fires(r.billedCl, r.tankRiseCl)) continue;
      const [, b] = rampRel(trip, r.t);
      const i = clampI(Math.ceil(b / step));
      const y = Math.max(12, Math.round(top(fuel[i]) - geo.refuelLift));
      const text = phone ? `+${L(r.tankRiseCl)} L ✓` : `+${L(r.tankRiseCl)} L refuel · bill ${L(r.billedCl)} L ✓`;
      notes.push({ i, y, text, fs });
    }
    // Desktop: the first steady dhaba or rest stop.
    if (!phone) {
      const st = steadyStops(ctx).find((x) => x.stop.kind === "dhaba" || x.stop.kind === "rest");
      if (st) {
        const i = clampI(Math.round(idx(st.stop.from)));
        const y = Math.max(12, Math.round(top(fuel[i]) - DESK.stopLift));
        notes.push({ i, y, text: `${st.stop.kind === "dhaba" ? "dhaba" : "rest"} stop · steady ✓`, fs: 12 });
      }
    }
    return notes;
  };

  const times = timeTicks(ctx, step, n, phone);
  const base = { step, fuel, speed, kind, times, notesAt, h: geo.h } as ReturnType<typeof series>;
  if (phone) Object.assign(base, { w: PHONE.w, gap: PHONE.gap, fs: PHONE.fs });
  if (window) base.window = window;
  if (expected) base.expected = expected;
  return base;
}

function timeTicks(ctx: Ctx, step: number, n: number, phone: boolean): { i: number; text: string }[] {
  const { trip } = ctx;
  const start = minToISTParts(trip.start);
  const hours = ctx.span / 60;
  const every = (hours <= 12 ? 2 : hours <= 24 ? 4 : 6) * (phone ? 2 : 1);
  const out: { i: number; text: string }[] = [{ i: 1, text: start.minute < 30 ? hourLabel(trip.start) : time(trip.start) }];
  const gapMin = Math.max(2, Math.round(n * 0.08));
  const lastI = n - 2;
  const firstHour = trip.start - start.minute;
  for (let t = firstHour + every * 60; t <= ctx.lastT; t += every * 60) {
    const i = Math.round((t - trip.start) / step);
    if (i - 1 < gapMin) continue;
    if (!phone && lastI - i < gapMin) continue;
    if (i > n - 1 - (phone ? 1 : 0)) continue;
    out.push({ i, text: hourLabel(t) });
  }
  if (!phone) out.push({ i: lastI, text: time(ctx.lastT) });
  return out;
}

interface SteadyStop {
  stop: Stop;
  steady: boolean;
}

/** The trip's stops other than refuels and the flagged one, with a steady-fuel check from the samples. */
function stopChecks(ctx: Ctx): SteadyStop[] {
  const { trip, flag } = ctx;
  const s = smoothFuelCl(asTrip(trip).samples);
  const out: SteadyStop[] = [];
  for (const stop of ctx.stops) {
    if (stop.kind === "refuel") continue;
    if (flag?.rule === "R1" && flag.at >= stop.from && flag.at < stop.to) continue;
    const a = stop.from - trip.start;
    const b = Math.min(stop.to - 1, ctx.lastT) - trip.start;
    if (a < 0 || b < a) continue;
    out.push({ stop, steady: Math.abs(s[a] - s[b]) <= 200 });
  }
  return out;
}

function steadyStops(ctx: Ctx): SteadyStop[] {
  return stopChecks(ctx).filter((x) => x.steady);
}

function chart(ctx: Ctx): ChartView {
  const { trip, flag } = ctx;
  // Cumulative km by minute, for R3's normal-use line.
  const cum: number[] = [0];
  for (let i = 1; i < trip.samples.length; i++) cum.push(cum[i - 1] + trip.samples[i - 1].speedKmh / 60);
  const totalKm = cum[cum.length - 1] || 1;
  const kmFrac = (t: Min) => cum[Math.max(0, Math.min(cum.length - 1, t - trip.start))] / totalKm;

  const deskStep = ctx.span <= 600 ? 5 : Math.ceil(ctx.span / MAX_BARS / 5) * 5;
  const d = series(ctx, deskStep, false, kmFrac);
  const p = series(ctx, deskStep * 2, true, kmFrac);
  const peak = Math.max(...d.fuel, ...(d.expected ?? []).map(([, v]) => v), ...p.fuel);
  // charts.js's 320 L scale, unless a bar or the dashed line would run off its top.
  const max = peak <= 315 ? 320 : 420;
  const ticks = max === 320 ? [0, 100, 200, 300] : [0, 100, 200, 300, 400];
  const finish = (x: ReturnType<typeof series>): WaveSeries => {
    const { notesAt, ...rest } = x;
    return { ...rest, max, ticks, notes: notesAt(max) };
  };

  const legend: ChartView["legend"] = [{ text: "Fuel", swatch: "fuel" }];
  if (flag?.rule === "R1") legend.push({ text: "The drop", swatch: "loss" });
  legend.push({ text: "Refuel", swatch: "refuel" });
  if (flag?.rule === "R1") legend.push({ text: "Without the drop", swatch: "dash" });
  if (flag?.rule === "R2") legend.push({ text: "What the bill says", swatch: "dash" });
  if (flag?.rule === "R3") legend.push({ text: "This truck’s normal use", swatch: "dash" });

  const lead = "Top: litres in the tank. Below the line: speed.";
  let note: string | null = lead;
  if (ctx.status === "live") note = `${lead} The trip is still on the road.`;
  else if (flag?.rule === "R1") note = `${lead} The drop happened while the truck wasn’t moving.`;
  else if (flag?.rule === "R2") {
    const bill = refuelAt(trip, flag.at);
    note = `${lead} The bill says ${bill ? L(bill.billedCl) : 0} L went in; the tank rose ${bill ? L(bill.tankRiseCl) : 0} L.`;
  } else if (flag?.rule === "R3") note = `${lead} The dashed line is this truck’s normal use on this route.`;
  else if (flag?.rule === "R4") note = `${lead} The fuel trace is normal; the extra km are the evidence.`;
  else if (flag?.rule === "R5") note = null;

  const desk = finish(d);
  return {
    count: `CAN fuel sensor + GPS · every ${deskStep} min`,
    legend,
    desk,
    phone: finish(p),
    label: chartLabel(ctx, desk),
    phoneLabel: phoneLabel(ctx),
    note,
    tolls: flag?.rule === "R5" ? tollTable(trip) : null,
  };
}

/** 'HP pump Neemrana' → 'Neemrana'; 'Kishangarh pump' → 'Kishangarh'. */
const pumpTown = (placeId: string) => placeById(placeId).name.en.replace(/^HP pump /, "").replace(/ (highway )?pump$/, "");

/** The desktop chart's label, in final/trip.html's words, generated from the data. */
function chartLabel(ctx: Ctx, desk: WaveSeries): string {
  const { trip, flag } = ctx;
  const steady = steadyStops(ctx);
  const flat = steady.length === 0 ? "" : steady.length === 1 && steady[0].stop.kind === "dhaba" ? ", stays flat at the dhaba stop" : ", stays flat at the stops";
  let first = `Fuel falls slowly while driving${flat}`;
  if (flag?.rule === "R1") {
    const near = flag.placeId ? ` near ${placeById(flag.placeId).name.en}` : "";
    first += `, then drops ${flag.litres} litres between ${andRange(flag.at, flag.until ?? flag.at)} while speed is zero${near}`;
  }
  const parts = ["Fuel and speed chart.", `${first}.`];
  for (const r of trip.refuels) {
    const flagged = flag?.rule === "R2" && flag.at === r.t;
    parts.push(
      flagged || r2Fires(r.billedCl, r.tankRiseCl)
        ? `At ${time(r.t)} the tank rises ${L(r.tankRiseCl)} litres, but the bill says ${L(r.billedCl)}.`
        : `At ${time(r.t)} a refuel adds ${L(r.tankRiseCl)} litres, matching the ${L(r.billedCl)} litre bill.`,
    );
  }
  const end = Math.round(desk.fuel[desk.fuel.length - 1]);
  const exp = desk.expected ? Math.round(desk.expected[desk.expected.length - 1][1]) : end;
  if (flag?.rule === "R1") parts.push(`Without the drop the tank would have ended at ${exp} litres instead of ${end}.`);
  if (flag?.rule === "R2") parts.push(`Had the whole bill gone into the tank, it would have ended at ${exp} litres instead of ${end}.`);
  if (flag?.rule === "R3") {
    parts.push(`The tank ended at ${end} litres; at this truck’s normal use it would have ended at ${exp}.`);
    if (spread(flag)) parts.push("The extra use is spread across the trip, not one stop.");
  }
  if (ctx.status === "live") parts.push(`The trip is still on the road; the chart ends at the last reading, ${time(ctx.lastT)}.`);
  return parts.join(" ");
}

const spread = (f: Flag) => f.evidence.some((e) => e.text.en.startsWith("Spread across the trip"));

/** The phone chart's short label (final/trip.html's `waveM`), generated from the data. */
function phoneLabel(ctx: Ctx): string {
  const { trip, flag } = ctx;
  const lead = "Fuel and speed chart: ";
  const refuel = (r: TripR["refuels"][number]) =>
    `a refuel at ${pumpTown(r.placeId)} that ${r2Fires(r.billedCl, r.tankRiseCl) ? "doesn’t match" : "matches"} the bill`;
  if (flag?.rule === "R1") {
    const near = flag.placeId ? ` near ${placeById(flag.placeId).name.en}` : "";
    const next = trip.refuels.find((r) => r.t > flag.at);
    return `${lead}a ${flag.litres} litre drop while parked${near} at ${time(flag.at)}${next ? `, then ${refuel(next)}` : ""}.`;
  }
  if (flag?.rule === "R2") {
    const bill = refuelAt(trip, flag.at);
    const where = flag.placeId ? ` at ${pumpTown(flag.placeId)}` : "";
    return `${lead}at ${time(flag.at)} the tank rose ${bill ? L(bill.tankRiseCl) : 0} litres${where}, but the bill says ${bill ? L(bill.billedCl) : 0}.`;
  }
  if (flag?.rule === "R3") {
    const { used, normal } = r3Litres(trip, flag);
    return `${lead}this trip used ${used} litres against this truck’s normal ${normal}${spread(flag) ? ", spread across the trip" : ""}.`;
  }
  const refs = trip.refuels.map(refuel);
  const live = ctx.status === "live" ? ", still on the road" : "";
  return `${lead}fuel falls only while driving${refs.length ? `, with ${refs.join(" and ")}` : ""}${live}.`;
}

function tollTable(trip: TripR): TollTable {
  const fastagInr = trip.fastag.reduce((a, e) => a + e.inr, 0);
  return {
    rows: trip.fastag.map((e) => ({ plaza: placeById(e.placeId).name.en, time: time(e.t), inr: e.inr })),
    fastagInr,
    claimedInr: trip.claims.tollsInr,
    diffInr: trip.claims.tollsInr - fastagInr,
  };
}

// ── Timeline ─────────────────────────────────────────────────────────────
function timeline(ctx: Ctx): TimelineEvent[] {
  const { trip, flags } = ctx;
  const route = routeById(trip.routeId);
  const s = smoothFuelCl(asTrip(trip).samples);
  const ev: { at: Min; e: TimelineEvent }[] = [];
  const add = (at: Min, e: Omit<TimelineEvent, "at">) => ev.push({ at, e: { ...e, at, t: time(at) } });

  add(trip.start, { t: "", dot: "lamp", text: `Left ${placeById(route.from).name.en}`, small: `Fuel ${L(trip.tank.startCl)} L`, flag: false });

  for (const { stop, steady } of stopChecks(ctx)) {
    const place = stop.placeId ? placeById(stop.placeId) : null;
    const dur = duration(Math.min(stop.to, ctx.lastT) - stop.from);
    const where =
      stop.kind === "dhaba"
        ? place ? `Dhaba stop, ${place.name.en.replace(/ dhaba$/i, "")}` : "Dhaba stop"
        : stop.kind === "rest"
          ? place ? `Rest stop, ${place.name.en}` : "Rest stop"
          : place ? `Parked, ${place.name.en}` : "Parked";
    const a = stop.from - trip.start;
    const b = Math.min(stop.to - 1, ctx.lastT) - trip.start;
    const fell = L(s[a] - s[b]);
    add(stop.from, {
      t: "",
      dot: steady ? "ok" : "",
      text: `${where} · ${dur}`,
      small: steady ? "Fuel steady, checked: nothing to see" : fell > 0 ? `Fuel fell ${fell} L` : `Fuel rose ${-fell} L`,
      flag: false,
    });
  }

  for (const e of trip.fastag) add(e.t, { t: "", dot: "", text: `FASTag · ${placeById(e.placeId).name.en}`, v: inr(e.inr), flag: false });

  for (const f of flags) {
    if (f.rule === "R1") {
      const run = runAt(trip, f.at);
      if (!run) continue;
      const smp = trip.samples;
      const off = distanceToPathM(lngLat(smp[f.at - trip.start].lngLat), route.path) / 1000;
      const near = f.placeId ? ` near ${placeById(f.placeId).name.en}` : "";
      const where = off >= 0.1 ? `${km1(off)} km off ${ctx.road}` : `on ${ctx.road}`;
      const offAt = smp.slice(run.i0, run.i1 + 1).find((x) => !x.ignition);
      add(trip.start + run.i0, {
        t: "",
        dot: "bad",
        text: `Parked ${where}${near}`,
        small: offAt ? `Ignition off ${time(offAt.t)}` : "Ignition on",
        flag: true,
      });
      add(f.at, {
        t: "",
        dot: "bad",
        text: `Fuel fell ${L(s[run.i0])} → ${L(s[run.i1])} L while parked`,
        small: `Flagged: ${RULE_FLAGGED.R1}`,
        v: `−${f.litres} L`,
        vTone: "loss",
        flag: true,
      });
      if (trip.start + run.i1 + 1 <= ctx.lastT) add(trip.start + run.i1 + 1, { t: "", dot: "lamp", text: "Moving again", flag: false });
    }
    if (f.rule === "R4") {
      const extra = `+${Math.round(extraKm(trip))} km`;
      if (f.at !== trip.start && f.until !== undefined) {
        add(f.at, { t: "", dot: "bad", text: "Left the planned route", small: `Flagged: ${RULE_FLAGGED.R4}`, v: extra, vTone: "loss", flag: true });
        add(f.until, { t: "", dot: "lamp", text: "Back on the planned route", flag: false });
      }
    }
  }

  for (const r of trip.refuels) {
    const pump = placeById(r.placeId).name.en;
    const flagged = flags.find((f) => f.rule === "R2" && f.at === r.t);
    const billed = L(r.billedCl);
    const rise = L(r.tankRiseCl);
    add(r.t, {
      t: "",
      dot: flagged ? "bad" : r2Fires(r.billedCl, r.tankRiseCl) ? "" : "ok",
      text: `Refuelled, ${pump}`,
      small: flagged
        ? `Bill ${billed} L · tank rose ${rise} L · flagged: ${RULE_FLAGGED.R2}`
        : `Bill ${billed} L · tank rose ${rise} L${r2Fires(r.billedCl, r.tankRiseCl) ? "" : ", matches"}`,
      v: inr(r.billedInr),
      flag: Boolean(flagged),
    });
  }

  if (ctx.status === "live") {
    add(ctx.lastT, { t: "", dot: "lamp", text: `On the road · last reading ${time(ctx.lastT)}`, small: `Fuel ${L(trip.tank.endCl)} L`, flag: false });
  } else {
    const to = placeById(route.to).name.en;
    add(trip.end, { t: "", dot: "lamp", text: route.from === route.to ? `Back at ${to}` : `Arrived ${to}`, small: `Fuel ${L(trip.tank.endCl)} L`, flag: false });
    for (const f of flags) {
      if (f.rule === "R3") {
        const { used, normal } = r3Litres(trip, f);
        add(trip.end, {
          t: "",
          dot: "bad",
          text: `Used ${used} L against this truck’s normal ${normal} L`,
          small: `Flagged: ${RULE_FLAGGED.R3}`,
          v: `+${f.litres} L`,
          vTone: "loss",
          flag: true,
        });
      }
      if (f.rule === "R4" && (f.at === trip.start || f.until === undefined)) {
        add(trip.end, {
          t: "",
          dot: "bad",
          text: `Drove ${grouped.format(Math.round(trip.actualKm))} km against a planned ${grouped.format(route.plannedKm)} km`,
          small: `Flagged: ${RULE_FLAGGED.R4}`,
          v: `+${Math.round(extraKm(trip))} km`,
          vTone: "loss",
          flag: true,
        });
      }
      if (f.rule === "R5") {
        const fastag = trip.fastag.reduce((a, e) => a + e.inr, 0);
        add(trip.end, {
          t: "",
          dot: "bad",
          text: `Toll claim ${inr(trip.claims.tollsInr)} · FASTag ${inr(fastag)}`,
          small: `Flagged: ${RULE_FLAGGED.R5}`,
          v: inr(f.inr),
          vTone: "loss",
          flag: true,
        });
      }
    }
  }
  // Stable: events at the same minute keep the order they were added in.
  return ev.sort((a, b) => a.at - b.at).map((x) => x.e);
}

// ── Ledger and route normal ──────────────────────────────────────────────
function ledger(ctx: Ctx): TripLedgerView {
  const { trip } = ctx;
  const freight: LedgerRow = { label: `Freight · ${trip.loadT} t ${trip.cargo.en}`, inr: trip.freightInr, kind: "row" };
  if (ctx.status === "live") {
    return { kind: "live", rows: [freight], note: "Diesel, tolls and profit are worked out when the trip arrives." };
  }
  const l = ledgerFor(trip.id);
  const litres = formatLitres(l.dieselCl / 100, l.dieselCl % 100 === 0 ? 0 : 2);
  const n = trip.fastag.length;
  const rows: LedgerRow[] = [freight, { label: `Diesel used · ${litres} × ${inr(DIESEL_INR_PER_L)}`, inr: neg(l.dieselInr), kind: "row" }];
  if (l.unaccountedCl > 0) {
    rows.push({ label: `of which unaccounted · ${formatLitres(l.unaccountedCl / 100, l.unaccountedCl % 100 === 0 ? 0 : 2)}`, inr: neg(l.unaccountedInr), kind: "unaccounted" });
  }
  rows.push(
    { label: n === 0 ? "Tolls · no FASTag plazas" : `Tolls · FASTag, ${n} ${n === 1 ? "plaza" : "plazas"}`, inr: neg(l.tollsInr), kind: "row" },
    { label: "Driver allowance", inr: neg(l.allowanceInr), kind: "row" },
    { label: "Loading & other", inr: neg(l.otherInr), kind: "row" },
    { label: "Profit", inr: l.profitInr, kind: "total" },
  );
  return { kind: "done", rows };
}

function routeNormalView(ctx: Ctx): RouteNormalView {
  const { trip } = ctx;
  if (ctx.status === "live") return { kind: "none", text: "This trip is compared with the route’s normal once it arrives." };
  const rn = routeNormalOf(trip.id);
  if (!rn) return { kind: "none", text: "No earlier clean trip on this route yet, so there’s no normal to compare." };
  const profit = ledgerFor(trip.id).profitInr;
  const hist = rn.history.map((h) => h.profitInr);
  const values = [...hist, profit];
  const k = hist.length;
  const top = Math.max(...values, rn.normalInr);
  const max = top > 0 ? Math.ceil((top * 1.06) / 500) * 500 : 500;
  const d = profit - rn.normalInr;
  const rel = d === 0 ? "level with" : `${inr(Math.abs(d))} ${d < 0 ? "below" : "above"}`;
  const between = k === 1 ? `1 trip at ${formatINR(hist[0])}` : `${k} trips between ${formatINR(Math.min(...hist))} and ${formatINR(Math.max(...hist))}`;
  const r = routeById(trip.routeId);
  const route = ctx.local ? routeName(trip.routeId).en : `${cityOf(r.from)} to ${cityOf(r.to)}`;
  return {
    kind: "chart",
    normalInr: rn.normalInr,
    values,
    kinds: [...hist.map(() => "dim" as const), d < 0 ? "loss" : "lit"],
    max,
    caption: `This route, last ${k + 1} trips`,
    refText: `- - normal ${inr(rn.normalInr)}`,
    label: `Profit on the ${route} route for the last ${k + 1} trips: ${between}, and this trip at ${formatINR(profit)}, ${rel} the normal of ${inr(rn.normalInr)}.`,
  };
}
