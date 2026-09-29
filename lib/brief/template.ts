/**
 * The Morning brief and the 7 AM message, in Hindi and English (technical-plan
 * §5.3, TSK-06.1). Every data-hi / data-en string in final/brief.html and
 * final/message.html is a template here, filled with numbers, places,
 * drivers and times computed from the day's flags and ledgers, so the brief
 * can never say what the data doesn't (S6).
 *
 * - Hindi times read "रात 2:14 बजे" (रात 9 PM–4 AM, सुबह 4 AM–12 PM,
 *   दोपहर 12–4 PM, शाम 4–9 PM), through lib/data/rules/text.ts.
 * - Confidence words: पक्का / शायद / जाँचें = High / Likely / Check.
 * - Wording: "doesn't add up" / "हिसाब नहीं मिल रहा"; never an accusation.
 *
 * Deterministic: no wall clock here (ESLint, §4.8). `dayKey` is the day the
 * trips ended ('2026-09-27'); the brief and the message go out the next
 * morning.
 */
import { MIN_PER_DAY, istMin } from "@/lib/clock";
import { BRICK_INR, day, days, isDiesel, september, weeks } from "@/lib/data/aggregates";
import { tripById, type ReadonlyFlag } from "@/lib/data/index";
import { routeById } from "@/lib/data/routes";
import { inr, timeEn, timeHi } from "@/lib/data/rules/text";
import type { Confidence, Min, Plate, TripId } from "@/lib/data/types";
import { getTripView, type WaveKind } from "@/lib/data/views/trip";
import { formatDateIST, formatTimeIST, minToISTParts } from "@/lib/format";
import {
  CONFIDENCE_WORDS,
  driverFirstName,
  FLEET_NAME,
  MONTHS_EN,
  MONTHS_HI,
  OWNER,
  town,
  WEEKDAYS_HI,
  type Lang,
} from "./dict";

export type { Lang };

// ── Contract ─────────────────────────────────────────────────────────────
/** Text with bold runs, as the mockup's `<b>` inside data-hi strings. */
export type Rich = readonly (string | { b: string })[];

export interface BriefItemCopy {
  tripId: TripId;
  plate: Plate;
  inr: number;
  confidence: Confidence;
  confidenceWord: string;
  text: string;
  /** The driver's side: 'Ramesh not asked yet' / 'रमेश से अभी नहीं पूछा'. */
  status: string;
  /** The link word: 'Evidence', or 'Review' once the driver has replied. */
  go: string;
  href: string;
}

export interface BriefCopy {
  lang: Lang;
  /** document.title */
  title: string;
  /** The page's (visually hidden) h1. */
  heading: string;
  greet: string;
  date: string;
  earned: {
    label: string;
    /** 'last 14 days' */
    span: string;
    inr: number;
    chartLabel: string;
    /** Daily profit, oldest first, ending on the brief's day. */
    series: { dayKeys: string[]; values: number[]; max: number };
  };
  /** The unaccounted line. `clean` (nothing unaccounted): the text stands alone, with no amount. */
  leak: { inr: number; text: string; clean: boolean };
  itemsHead: string;
  items: BriefItemCopy[];
  /** Set with ?only=high: what is filtered, and the way back to every item. */
  filter: { text: string; showAll: string; href: string } | null;
  /** The line for the trips that add up; null when none does. */
  clean: Rich | null;
  month: {
    ariaLabel: string;
    flaggedLabel: string;
    flaggedInr: number;
    recoveredLabel: string;
    recoveredInr: number;
    weeksLabel: string;
    weeks: { label: string; lit: number; total: number }[];
    cap: string;
  };
  ask: { label: string; placeholder: string; button: string };
}

export interface MessageCopy {
  lang: Lang;
  title: string;
  heading: string;
  /** 'Accounts for Sharma Roadlines' */
  account: string;
  day: string;
  preview: {
    title: string;
    meta: string;
    /** The top flag's trip, as the phone chart samples it (10-min bars for 0926-04). */
    trace: { tripId: TripId; fuel: number[]; kind: WaveKind[] } | null;
  };
  headline: string;
  intro: string;
  items: Rich[];
  clean: string | null;
  /** The message's timestamp: '7:00'. */
  time: string;
  /** 'Open today’s brief': the action link, and the preview card's accessible name. */
  open: string;
  briefHref: string;
  replies: { text: string; href: string }[];
  caption: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────
const APOS = "’";
/** The 7 AM message goes out at this hour the morning after (§1: timestamp 7:00). */
export const MESSAGE_HOUR = 7;
/** How many items the brief and the message list. */
const MAX_ITEMS = 3;
/** Days in the brief's profit chart. */
const SERIES_DAYS = 14;

/** 'YYYY-MM-DD' → 00:00 IST that day. */
function dayStart(key: string): Min {
  const [y, m, d] = key.split("-").map(Number);
  return istMin(y, m, d);
}

/** Minute → 'YYYY-MM-DD' (IST). */
function keyOf(t: Min): string {
  const { year, month, day: d } = minToISTParts(t);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 'सोमवार, 28 सितंबर' / 'Monday, 28 September'. */
function longDate(t: Min, lang: Lang): string {
  if (lang === "en") return formatDateIST(t, "long");
  const { weekday, day: d, month } = minToISTParts(t);
  return `${WEEKDAYS_HI[weekday]}, ${d} ${MONTHS_HI[month - 1]}`;
}

/** A whole hour in words: 'सुबह 7 बजे' / '7 AM'. */
function hourWords(t: Min, lang: Lang): string {
  return lang === "hi" ? `${timeHi(t).replace(/:00$/, "")} बजे` : timeEn(t).replace(":00", "");
}

/** 'Kishangarh pump, 4:50 PM': the bill nearest the flag. */
function billAt(f: ReadonlyFlag) {
  const refuels = tripById(f.tripId).refuels;
  return [...refuels].sort((a, b) => Math.abs(a.t - f.at) - Math.abs(b.t - f.at))[0];
}

/** Whether the ignition was off at any minute of an R1 drop (parked) or on throughout (standing). */
function parkedDuring(f: ReadonlyFlag): boolean {
  const trip = tripById(f.tripId);
  const until = f.until ?? f.at;
  return trip.samples.some((s) => s.t >= f.at && s.t <= until && !s.ignition);
}

const L = (cl: number) => Math.round(cl / 100);

/** A rich string as the mockup's HTML (tests and the Hindi review). */
export function richToHtml(r: Rich): string {
  return r.map((p) => (typeof p === "string" ? p : `<b>${p.b}</b>`)).join("");
}

/** The day's flags the owner hasn't marked wrong, in eye order. */
function openFlags(dayKey: string): ReadonlyFlag[] {
  return day(dayKey).flags.filter((f) => f.status !== "wrong");
}

const briefHref = (lang: Lang, only?: "high") => {
  const q = [only ? `only=${only}` : "", lang === "en" ? "lang=en" : ""].filter(Boolean).join("&");
  return q ? `/brief?${q}` : "/brief";
};

/** A flag with no evidence line (never expected; the rules always write one). */
export const NO_EVIDENCE = { hi: "हिसाब नहीं मिल रहा", en: `Doesn${APOS}t add up` } as const;

// ── Shared pieces (the templates and docs/exec/hindi-review.md use the same ones) ──
/** Hindi verb agreement: the singular form for exactly one ("1 ट्रिप पूरी हुई"), the plural otherwise. */
export function hiVerb(n: number, sg: string, pl: string): string {
  return n === 1 ? sg : pl;
}

/** What an R1 sentence needs: litres, the nearby town (if any), parked or standing, and when. */
export interface R1Parts {
  litres: number;
  place: { hi: string; en: string } | null;
  parked: boolean;
  at: Min;
}

/** An R1 drop in words, as the brief item (`brief`) or the message line (`message`) says it. */
export function r1Text(p: R1Parts, lang: Lang, form: "brief" | "message"): string {
  const place = p.place?.[lang] ?? null;
  if (lang === "hi") {
    const truck = `${p.parked ? "खड़े" : "रुके"} ट्रक में ${p.litres} L डीज़ल`;
    return form === "brief"
      ? `${place ? `${place} के पास ` : ""}${truck} का हिसाब नहीं — ${timeHi(p.at)} बजे`
      : `${place ? `${place} के पास, ` : ""}${timeHi(p.at)}, ${truck} कम`;
  }
  const verb = form === "brief" ? "unaccounted" : "down";
  return `${p.litres} L diesel ${verb} while ${p.parked ? "parked" : "standing"}${place ? ` near ${place}` : ""}, ${timeEn(p.at)}`;
}

function r1Parts(f: ReadonlyFlag): R1Parts {
  const place = f.placeId ? { hi: town(f.placeId, "hi"), en: town(f.placeId, "en") } : null;
  return { litres: f.litres ?? 0, place, parked: parkedDuring(f), at: f.at };
}

/** The preview card's title: about diesel when the top flag is a diesel flag. */
export function previewTitle(diesel: boolean, lang: Lang): string {
  if (diesel) return lang === "hi" ? "डीज़ल कहाँ गया?" : "Where did the diesel go?";
  return lang === "hi" ? "पैसा कहाँ गया?" : "Where did the money go?";
}

/** '17 trips finished. Look at these 3:' for `trips` finished and `n` listed. */
export function messageIntro(trips: number, n: number, lang: Lang): string {
  if (lang === "hi") {
    const look = n === 0 ? "" : n === 1 ? " इसे देखें:" : ` इन ${n} को देखें:`;
    return `${trips} ट्रिप पूरी ${hiVerb(trips, "हुई", "हुईं")}।${look}`;
  }
  const look = n === 0 ? "" : n === 1 ? " Look at this one:" : ` Look at these ${n}:`;
  return `${trips} ${trips === 1 ? "trip" : "trips"} finished.${look}`;
}

/** The message's line for the trips that add up; null when none does. */
export function messageClean(trips: number, flaggedTrips: number, lang: Lang): string | null {
  const others = trips - flaggedTrips;
  if (trips === 0 || others <= 0) return null;
  if (lang === "hi") {
    const n = flaggedTrips === 0 ? trips : others;
    return `${flaggedTrips === 0 ? "सभी" : "बाकी"} ${n} ट्रिप ठीक ${hiVerb(n, "है", "हैं")} ✓`;
  }
  if (flaggedTrips === 0) return trips === 1 ? `Yesterday${APOS}s trip is fine ✓` : `All ${trips} trips are fine ✓`;
  return others === 1 ? "The other trip is fine ✓" : `The other ${others} trips are fine ✓`;
}

// ── One flag, in words ───────────────────────────────────────────────────
/** The brief item's sentence (final/brief.html `.item .txt`). */
export function briefItemText(f: ReadonlyFlag, lang: Lang): string {
  const litres = f.litres ?? 0;
  switch (f.rule) {
    case "R1":
      return r1Text(r1Parts(f), lang, "brief");
    case "R2": {
      const bill = billAt(f);
      if (!bill) break;
      const where = town(bill.placeId, lang);
      return lang === "hi"
        ? `${where} में बिल ${L(bill.billedCl)} L का, पर टंकी में सिर्फ़ ${L(bill.tankRiseCl)} L बढ़ा`
        : `Fuel bill says ${L(bill.billedCl)} L, but the tank rose only ${L(bill.tankRiseCl)} L — ${where}`;
    }
    case "R3": {
      const to = town(routeById(tripById(f.tripId).routeId).to, lang);
      return lang === "hi"
        ? `${to} ट्रिप में आम से ${litres} L ज़्यादा डीज़ल लगा`
        : `Used ${litres} L more diesel than usual on the ${to} run`;
    }
  }
  // R4 and R5 have no mockup line; their first evidence line is already bilingual.
  return f.evidence[0]?.text[lang] ?? NO_EVIDENCE[lang];
}

/** The message's shorter sentence (final/message.html `ol li`). */
export function messageItemText(f: ReadonlyFlag, lang: Lang): string {
  const litres = f.litres ?? 0;
  switch (f.rule) {
    case "R1":
      return r1Text(r1Parts(f), lang, "message");
    case "R2": {
      const bill = billAt(f);
      if (!bill) break;
      return lang === "hi"
        ? `बिल ${L(bill.billedCl)} L, टंकी में ${L(bill.tankRiseCl)} L`
        : `bill ${L(bill.billedCl)} L, tank rose ${L(bill.tankRiseCl)} L`;
    }
    case "R3": {
      const to = town(routeById(tripById(f.tripId).routeId).to, lang);
      return lang === "hi" ? `${to} ट्रिप में ${litres} L ज़्यादा डीज़ल` : `${litres} L more diesel than usual to ${to}`;
    }
  }
  return briefItemText(f, lang);
}

/** The driver's side and the link word for one flag. */
export function driverLine(f: ReadonlyFlag, lang: Lang): { status: string; go: string } {
  const who = driverFirstName(f.plate, lang);
  const evidence = lang === "hi" ? "सबूत" : "Evidence";
  switch (f.driverSide.state) {
    case "not-asked":
      return { status: lang === "hi" ? `${who} से अभी नहीं पूछा` : `${who} not asked yet`, go: evidence };
    case "replied":
      return { status: lang === "hi" ? `${who} ने जवाब दिया` : `${who} replied`, go: lang === "hi" ? "देखें" : "Review" };
    case "confirmed":
      return { status: lang === "hi" ? `${who} ने मान लिया` : `${who} confirmed`, go: evidence };
    case "cleared":
      return { status: lang === "hi" ? `${who} की बात सही निकली` : `Cleared by ${who}`, go: evidence };
  }
}

// ── The brief ────────────────────────────────────────────────────────────
/** The items section's heading, for the shown count. */
export function itemsHead(n: number, lang: Lang, onlyHigh: boolean): string {
  if (n === 0) {
    if (onlyHigh) return lang === "hi" ? "कल कोई पक्का मामला नहीं" : "Nothing marked High yesterday";
    return lang === "hi" ? "आज देखने को कुछ नहीं" : "Nothing to look at today";
  }
  if (n === 1) return lang === "hi" ? "इस ट्रिप को देखें" : "Look at this trip";
  return lang === "hi" ? `इन ${n} ट्रिप को देखें` : `Look at these ${n} trips`;
}

/** The line for the trips that add up. */
export function cleanRich(trips: number, flaggedTrips: number, lang: Lang): Rich | null {
  const others = trips - flaggedTrips;
  if (trips === 0 || others <= 0) return null;
  if (lang === "hi") {
    const tail = " का हिसाब ठीक है — डीज़ल, टोल और किलोमीटर सब मेल खाते हैं।";
    return flaggedTrips === 0 ? ["सभी ", { b: `${trips} ट्रिप` }, tail] : ["बाकी ", { b: `${others} ट्रिप` }, tail];
  }
  const tail = (one: boolean) => ` ${one ? "adds" : "add"} up — diesel, tolls and km all match.`;
  const trip = (n: number) => `${n} ${n === 1 ? "trip" : "trips"}`;
  if (flaggedTrips === 0) return trips === 1 ? ["Yesterday", APOS, "s ", { b: trip(1) }, tail(true)] : ["All ", { b: trip(trips) }, tail(false)];
  return ["The other ", { b: trip(others) }, tail(others === 1)];
}

/** The 14-day chart's label, honest about yesterday's rank. */
export function chartLabel(values: number[], lang: Lang): string {
  const last = values[values.length - 1] ?? 0;
  const rank = 1 + values.filter((v) => v > last).length;
  const n = values.length;
  if (lang === "hi") {
    const head = `पिछले ${n} दिन की कमाई`;
    if (rank === 1) return `${head}, कल की सबसे ऊँची`;
    if (rank <= 3) return `${head}, कल की सबसे ऊँची में से एक`;
    return `${head}; कल ${inr(last)}`;
  }
  const head = `Profit over the last ${n} days`;
  if (rank === 1) return `${head}; yesterday was the highest`;
  if (rank <= 3) return `${head}; yesterday was one of the highest`;
  return `${head}; yesterday ${inr(last)}`;
}

/** A clean chart top: 1.05 × the best day, rounded up to ₹10,000 (₹2,10,000 for 14–27 Sep, as the mockup's 2.1 lakh). */
const chartMax = (values: number[]) => Math.max(10_000, Math.ceil((Math.max(0, ...values) * 1.05) / 10_000) * 10_000);

/** The Morning brief for the trips that ended on `dayKey` (final/brief.html). */
export function renderBrief(dayKey: string, lang: Lang, opts: { onlyHigh?: boolean } = {}): BriefCopy {
  const onlyHigh = opts.onlyHigh === true;
  const d = day(dayKey);
  const open = openFlags(dayKey);
  const flaggedTrips = new Set(open.map((f) => f.tripId)).size;
  const listed = open.slice(0, MAX_ITEMS);
  const shown = (onlyHigh ? open.filter((f) => f.confidence === "high") : open).slice(0, MAX_ITEMS);
  const briefDay = dayStart(dayKey) + MIN_PER_DAY;
  const { month } = minToISTParts(dayStart(dayKey));
  const monthName = lang === "hi" ? MONTHS_HI[month - 1] : MONTHS_EN[month - 1];
  const series = days(keyOf(dayStart(dayKey) - (SERIES_DAYS - 1) * MIN_PER_DAY), dayKey);
  const values = series.map((p) => p.profitInr);
  const sept = september();
  const hi = lang === "hi";
  const tripsWord = d.trips === 1 ? "trip" : "trips";

  return {
    lang,
    title: hi ? "सुबह का हिसाब · Urja" : "Morning brief · Urja",
    heading: hi ? "सुबह का हिसाब" : "Morning brief",
    greet: hi ? `सुप्रभात, ${OWNER.hi}` : `Good morning, ${OWNER.en}`,
    date: hi
      ? `${longDate(briefDay, "hi")} · कल की ${d.trips} ट्रिप का हिसाब`
      : `${longDate(briefDay, "en")} · yesterday${APOS}s ${d.trips} ${tripsWord} reconciled`,
    earned: {
      label: hi ? "कल की कमाई" : "Earned yesterday",
      span: hi ? `पिछले ${values.length} दिन` : `last ${values.length} days`,
      inr: d.profitInr,
      chartLabel: chartLabel(values, lang),
      series: { dayKeys: series.map((p) => p.dayKey), values, max: chartMax(values) },
    },
    leak:
      d.unaccountedInr > 0
        ? {
            inr: d.unaccountedInr,
            text: hi
              ? `का हिसाब नहीं मिल रहा · ${flaggedTrips} ट्रिप में`
              : `doesn${APOS}t add up · across ${flaggedTrips} ${flaggedTrips === 1 ? "trip" : "trips"}`,
            clean: false,
          }
        : { inr: 0, text: hi ? "सारा हिसाब ठीक है" : "Everything adds up", clean: true },
    itemsHead: itemsHead(shown.length, lang, onlyHigh),
    items: shown.map((f) => ({
      tripId: f.tripId,
      plate: f.plate,
      inr: f.inr,
      confidence: f.confidence,
      confidenceWord: CONFIDENCE_WORDS[f.confidence][lang],
      text: briefItemText(f, lang),
      ...driverLine(f, lang),
      href: `/trips/${f.tripId}`,
    })),
    filter: onlyHigh
      ? {
          text: hi ? "सिर्फ़ पक्के वाले दिख रहे हैं" : "Showing only high ones",
          showAll: hi ? `सभी ${listed.length} देखें` : `Show all ${listed.length}`,
          href: briefHref(lang),
        }
      : null,
    clean: cleanRich(d.trips, flaggedTrips, lang),
    month: {
      ariaLabel: hi ? `${monthName} अब तक` : `${monthName} so far`,
      flaggedLabel: hi ? `${monthName} में पकड़ा` : `Flagged in ${monthName}`,
      flaggedInr: sept.flaggedInr,
      recoveredLabel: hi ? "वापस मिला" : "Recovered",
      recoveredInr: sept.recoveredInr,
      weeksLabel: hi ? "हफ़्तेवार: पकड़ा और वापस मिला" : "Flagged and recovered, week by week",
      weeks: weeks().map((w) => ({ label: w.label, lit: w.bricks.lit, total: w.bricks.total })),
      cap: hi ? `हर ब्लॉक ≈ ${inr(BRICK_INR)} · चमकीले = वापस मिला` : `Each block ≈ ${inr(BRICK_INR)} · lit = recovered`,
    },
    ask: {
      label: hi ? "Urja से पूछें" : "Ask Urja",
      placeholder: hi ? "कुछ भी पूछें, हिंदी या English में…" : "Ask anything, in Hindi or English…",
      button: hi ? "पूछें" : "Ask",
    },
  };
}

// ── The 7 AM message ─────────────────────────────────────────────────────
/** The 7 AM WhatsApp message for the trips that ended on `dayKey` (final/message.html). */
export function renderMessage(dayKey: string, lang: Lang): MessageCopy {
  const d = day(dayKey);
  const open = openFlags(dayKey);
  const flaggedTrips = new Set(open.map((f) => f.tripId)).size;
  const listed = open.slice(0, MAX_ITEMS);
  const top = listed[0];
  const at = dayStart(dayKey) + MIN_PER_DAY + MESSAGE_HOUR * 60;
  const hi = lang === "hi";
  const phone = top ? getTripView(top.tripId)?.chart.phone : undefined;

  const replies: MessageCopy["replies"] = [];
  if (top) {
    const who = driverFirstName(top.plate, lang);
    replies.push({ text: hi ? `${who} से पूछो` : `Ask ${who}`, href: `/trips/${top.tripId}#driver` });
  }
  replies.push({ text: hi ? "सिर्फ़ पक्के वाले" : "Only high ones", href: briefHref(lang, "high") });

  const diesel = top ? isDiesel(top) : true;
  return {
    lang,
    title: hi ? `${hourWords(at, "hi")} का संदेश · Urja` : `${hourWords(at, "en")} message · Urja`,
    heading: hi ? `${hourWords(at, "hi")} का संदेश` : `${hourWords(at, "en")} message`,
    account: hi ? `${FLEET_NAME} का हिसाब` : `Accounts for ${FLEET_NAME}`,
    day: hi ? "आज" : "Today",
    preview: {
      title: previewTitle(diesel, lang),
      meta: hi ? `आज का हिसाब · ${FLEET_NAME}` : `Today${APOS}s brief · ${FLEET_NAME}`,
      trace: top && phone ? { tripId: top.tripId, fuel: [...phone.fuel], kind: [...phone.kind] } : null,
    },
    headline:
      d.unaccountedInr > 0
        ? hi
          ? `कल: ${inr(d.profitInr)} कमाए · ${inr(d.unaccountedInr)} का हिसाब नहीं`
          : `Yesterday: ${inr(d.profitInr)} earned · ${inr(d.unaccountedInr)} doesn${APOS}t add up`
        : hi
          ? `कल: ${inr(d.profitInr)} कमाए · सारा हिसाब ठीक`
          : `Yesterday: ${inr(d.profitInr)} earned · everything adds up`,
    intro: messageIntro(d.trips, listed.length, lang),
    items: listed.map((f) => [
      { b: f.plate },
      ` — ${messageItemText(f, lang)}${hi ? "।" : "."} ${inr(f.inr)} · `,
      { b: CONFIDENCE_WORDS[f.confidence][lang] },
    ]),
    clean: messageClean(d.trips, flaggedTrips, lang),
    time: formatTimeIST(at).replace(/ (AM|PM)$/, ""),
    open: hi ? "पूरा हिसाब देखें" : `Open today${APOS}s brief`,
    briefHref: briefHref(lang),
    replies,
    caption: hi
      ? `ऐसे WhatsApp पर ${hourWords(at, "hi")} आता है (डिज़ाइन प्रोटोटाइप)`
      : `How it arrives on WhatsApp at ${hourWords(at, "en")} (design prototype)`,
  };
}
