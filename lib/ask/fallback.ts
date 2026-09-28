/**
 * The deterministic fallback (technical-plan §6.5). When the model can't
 * answer (timeout, error, guard), a recognised question gets a Hindi or
 * English template filled from the same aggregate functions the screens use,
 * so its numbers can't drift from Today, the trip pages or the brief.
 * An unrecognised question gets `null`; the route answers it with SAVED_MESSAGE.
 */
import { SEPT_FIRST_DAY, YESTERDAY_DAY, last7, september, stretch, truckDiesel, trucks, yesterday } from "@/lib/data/aggregates";
import { getDataset, tripById, type ReadonlyFlag } from "@/lib/data";
import { FLEET, truckByPlate } from "@/lib/data/fleet";
import { rangeEn, rangeHi, timeEn, timeHi } from "@/lib/data/rules/text";
import { placeById } from "@/lib/data/places";
import { STRETCHES, routeName } from "@/lib/data/routes";
import type { Lang, Plate } from "@/lib/data/types";
import { DEMO_NOW, MIN_PER_DAY, dayKey } from "@/lib/clock";
import { formatDateIST, formatINR, minToISTParts } from "@/lib/format";
import { WRONG_FLAG_LIMIT_PCT } from "./context";
import { detectLang, matchIntent, type IntentId } from "./intents";
import { RULE_LABEL, STATUS_LABEL, confidenceWord, dayLabel, flagPlace } from "./labels";

export const SAVED_MESSAGE: Record<Lang, string> = {
  en: "Your question is saved. Try again in a minute for a written answer.",
  hi: "आपका सवाल सहेज लिया गया है। लिखित जवाब के लिए एक मिनट बाद फिर पूछें।",
};

export interface FallbackAnswer {
  intent: IntentId;
  answer: string;
  lang: Lang;
  /** Trip ids the answer rests on; every one exists. */
  cites: string[];
}

// ── Formatting ───────────────────────────────────────────────────────────
const inr = (n: number) => formatINR(n, { sign: "never" });
const perKm = (n: number) => `₹${n.toFixed(1)}`;
const num = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const L = (n: number, lang: Lang) => (lang === "hi" ? `${num(n)} लीटर` : `${num(n)} L`);
const MONTHS_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

/** '27 Sep' / '27 सितंबर' from a day key. */
function day(key: string, lang: Lang): string {
  if (lang === "en") return dayLabel(key);
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS_HI[m - 1]}`;
}

/** '27 Sep' / '27 सितंबर' for a minute. */
function dateOf(t: number, lang: Lang): string {
  return day(dayKey(t), lang);
}

const driverOf = (plate: Plate, lang: Lang) => truckByPlate(plate).driver.name[lang];
const firstName = (plate: Plate, lang: Lang) => driverOf(plate, lang).split(" ")[0];
const list = (items: string[]) => items.join("; ");

// ── One flag, in a sentence or three ─────────────────────────────────────
function refuelFor(f: ReadonlyFlag) {
  const refuels = tripById(f.tripId).refuels;
  return [...refuels].sort((a, b) => Math.abs(a.t - f.at) - Math.abs(b.t - f.at))[0];
}

function flagSentence(f: ReadonlyFlag, lang: Lang): string {
  const who = `${f.plate}, ${driverOf(f.plate, lang)}`;
  const place = flagPlace(f, lang) ?? "";
  const litres = f.litres ?? 0;
  const ev = f.evidence[0]?.text[lang] ?? "";
  const trip = lang === "hi" ? `ट्रिप ${f.tripId} (${who})` : `Trip ${f.tripId} (${who})`;
  let what: string;
  if (lang === "en") {
    switch (f.rule) {
      case "R1":
        what = `fuel fell ${L(litres, lang)} (${inr(f.inr)}) while the truck stood near ${place}, ${rangeEn(f.at, f.until ?? f.at)} on ${dateOf(f.at, lang)}.`;
        break;
      case "R2": {
        const r = refuelFor(f);
        what = r
          ? `at the ${place}, ${timeEn(f.at)} on ${dateOf(f.at, lang)}, the bill says ${L(r.billedCl / 100, lang)} but the tank rose only ${L(r.tankRiseCl / 100, lang)}, so ${L(litres, lang)} (${inr(f.inr)}) doesn't add up.`
          : `${ev}; ${L(litres, lang)} (${inr(f.inr)}) doesn't add up.`;
        break;
      }
      case "R3":
        what = `${routeName(tripById(f.tripId).routeId).en}: the truck used ${L(litres, lang)} (${inr(f.inr)}) more diesel than its normal. ${ev}.`;
        break;
      case "R4":
        what = `${ev}; the extra km cost ${inr(f.inr)} of diesel.`;
        break;
      case "R5":
        what = `${ev}, so ${inr(f.inr)} doesn't add up.`;
        break;
    }
  } else {
    switch (f.rule) {
      case "R1":
        what = `${dateOf(f.at, lang)} ${rangeHi(f.at, f.until ?? f.at)} ${place} के पास खड़े ट्रक में डीज़ल ${L(litres, lang)} (${inr(f.inr)}) घटा।`;
        break;
      case "R2": {
        const r = refuelFor(f);
        what = r
          ? `${dateOf(f.at, lang)} ${timeHi(f.at)} ${place} पर बिल ${L(r.billedCl / 100, lang)} का है, पर टंकी सिर्फ़ ${L(r.tankRiseCl / 100, lang)} बढ़ी; ${L(litres, lang)} (${inr(f.inr)}) का हिसाब नहीं मिल रहा।`
          : `${ev}; ${L(litres, lang)} (${inr(f.inr)}) का हिसाब नहीं मिल रहा।`;
        break;
      }
      case "R3":
        what = `${routeName(tripById(f.tripId).routeId).hi}: सामान्य से ${L(litres, lang)} (${inr(f.inr)}) ज़्यादा डीज़ल लगा। ${ev}।`;
        break;
      case "R4":
        what = `${ev}; ज़्यादा किलोमीटर का डीज़ल ${inr(f.inr)}।`;
        break;
      case "R5":
        what = `${ev}; ${inr(f.inr)} का हिसाब नहीं मिल रहा।`;
        break;
    }
  }
  const conf = confidenceWord(f.confidence, lang);
  const confLine =
    lang === "hi"
      ? ` भरोसा: ${conf}।${f.confidence === "high" ? "" : ` ${f.whyConfidence.hi}`}`
      : ` Confidence: ${conf}.${f.confidence === "high" ? "" : ` ${f.whyConfidence.en}`}`;
  const status = lang === "hi" ? ` स्थिति: ${STATUS_LABEL[f.status].hi}।` : ` Status: ${STATUS_LABEL[f.status].en}.`;
  const name = firstName(f.plate, lang);
  const text = f.driverSide.text?.[lang];
  let side = "";
  if (f.driverSide.state === "not-asked") side = lang === "hi" ? ` ${name} से अभी पूछा नहीं गया।` : ` ${name} hasn't been asked yet.`;
  else if (text) side = lang === "hi" ? ` ${name} का जवाब: “${text}”` : ` ${name}'s side: “${text}”`;
  return `${trip}: ${what}${confLine}${status}${side}`;
}

// ── Templates ────────────────────────────────────────────────────────────
function driverMostDiesel(lang: Lang): FallbackAnswer {
  const rows = FLEET.map((t) => ({ plate: t.plate, ...truckDiesel(t.plate) })).sort((a, b) => b.litres - a.litres || b.inr - a.inr);
  const top = rows[0];
  const trips = top.flags.map((f) => `${f.tripId} (${L(f.litres ?? 0, lang)})`);
  const allCheck = top.flags.every((f) => f.confidence === "check");
  const answer =
    lang === "hi"
      ? `इस महीने सबसे ज़्यादा डीज़ल का हिसाब ${driverOf(top.plate, lang)} (${top.plate}) का नहीं मिल रहा: ${top.flags.length} ट्रिप में ${L(top.litres, lang)} (${inr(top.inr)}) — ${list(trips)}।` +
        (allCheck ? ` ये सब ‘जाँचें’ वाले फ़्लैग हैं: ज़्यादा खपत की दूसरी वजहें भी हो सकती हैं, जैसे भारी लोड।` : "")
      : `${driverOf(top.plate, lang)} (${top.plate}) had the most diesel unaccounted this month: ${L(top.litres, lang)} (${inr(top.inr)}) more than normal on ${top.flags.length} trips — ${list(trips)}.` +
        (allCheck ? ` All of them are Check flags: the extra use can have other causes, such as a heavier load.` : "");
  return { intent: "driver_most_diesel", answer, lang, cites: top.flags.map((f) => f.tripId) };
}

function lastWeekDiesel(lang: Lang): FallbackAnswer {
  const w = last7();
  const trips = [...new Set(w.tripIds)];
  const items = w.flags.map((f) => `${f.tripId} (${f.plate}, ${L(f.litres ?? 0, lang)})`);
  const range = `${Number(w.fromDay.slice(8))}–${day(w.toDay, lang)}`;
  const answer =
    lang === "hi"
      ? `पिछले हफ़्ते (${range}) ${trips.length} ट्रिप में ${L(w.litres, lang)} डीज़ल (${inr(w.inr)}) का हिसाब नहीं मिल रहा: ${list(items)}।`
      : `Last week (${range}), ${L(w.litres, lang)} of diesel (${inr(w.inr)}) was unaccounted on ${trips.length} trips: ${list(items)}.`;
  return { intent: "last_week_diesel", answer, lang, cites: trips };
}

function perKmAnswer(which: "least" | "best", lang: Lang): FallbackAnswer {
  const rows = trucks();
  const r = which === "best" ? rows[0] : rows[rows.length - 1];
  const d = truckDiesel(r.plate);
  const driver = r.driver[lang];
  let answer: string;
  if (which === "best") {
    const flags = r.flags === 0 ? (lang === "hi" ? "कोई फ़्लैग नहीं" : "no flags") : lang === "hi" ? `${r.flags} फ़्लैग` : `${r.flags} flags`;
    answer =
      lang === "hi"
        ? `सबसे ज़्यादा कमाई प्रति किलोमीटर ${r.plate} (${driver}) की है: सितंबर में ${perKm(r.perKm)} प्रति किलोमीटर, ${num(r.km)} किलोमीटर में, ${flags}।`
        : `${r.plate} (${driver}) earns the most: ${perKm(r.perKm)} per km in September, over ${num(r.km)} km, with ${flags}.`;
  } else {
    const why =
      d.litres > 0
        ? lang === "hi"
          ? ` वजह: ${d.flags.length} ट्रिप (${d.tripIds.join(", ")}) में सामान्य से ${L(d.litres, lang)} डीज़ल (${inr(d.inr)}) ज़्यादा लगा।` +
            (d.flags.every((f) => f.confidence === "check") ? ` ये ‘जाँचें’ वाले फ़्लैग हैं: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं।` : "")
          : ` Why: it used ${L(d.litres, lang)} of diesel (${inr(d.inr)}) more than normal on ${d.flags.length} trips (${d.tripIds.join(", ")}).` +
            (d.flags.every((f) => f.confidence === "check") ? ` These are Check flags: the extra use can have other causes, such as a heavier load.` : "")
        : "";
    answer =
      lang === "hi"
        ? `सबसे कम कमाई प्रति किलोमीटर ${r.plate} (${driver}) की है: सितंबर में ${perKm(r.perKm)} प्रति किलोमीटर, ${num(r.km)} किलोमीटर में।${why}`
        : `${r.plate} (${driver}) earns the least: ${perKm(r.perKm)} per km in September, over ${num(r.km)} km.${why}`;
  }
  return { intent: which === "best" ? "best_per_km" : "least_per_km", answer, lang, cites: which === "best" ? [] : [...d.tripIds] };
}

function behrorFlags(lang: Lang): FallbackAnswer {
  const s = stretch("behror");
  const items = s.flags.map((f) => `${f.tripId} (${f.plate}, ${day(f.dayKey, lang)}, ${L(f.litres ?? 0, lang)}, ${STATUS_LABEL[f.status][lang]})`);
  const answer =
    lang === "hi"
      ? `सितंबर में ${placeById(STRETCHES.behror.centerPlaceId).name.hi} वाले हिस्से पर ${s.flags.length} फ़्लैग, कुल ${L(s.litres, lang)} (${inr(s.inr)}): ${list(items)}।`
      : `${s.flags.length} flags on the ${s.name.en} in September, ${L(s.litres, lang)} (${inr(s.inr)}) in all: ${list(items)}.`;
  return { intent: "behror_flags", answer, lang, cites: [...new Set(s.flags.map((f) => f.tripId))] };
}

function yesterdaySummary(lang: Lang): FallbackAnswer {
  const y = yesterday();
  const counted = y.flags.filter((f) => f.status !== "wrong");
  const trips = [...new Set(counted.map((f) => f.tripId))];
  const items = counted.map((f) => `${f.tripId} (${f.plate}, ${inr(f.inr)}, ${confidenceWord(f.confidence, lang)})`);
  const t = DEMO_NOW - MIN_PER_DAY;
  const date = lang === "hi" ? `${WEEKDAYS_HI[minToISTParts(t).weekday]} ${day(YESTERDAY_DAY, lang)}` : formatDateIST(t, "weekday-day-month");
  const others = y.trips - trips.length;
  const answer =
    lang === "hi"
      ? `कल (${date}) ${y.trips} ट्रिप से ${inr(y.profitInr)} की कमाई हुई। ${trips.length} ट्रिप में ${inr(y.unaccountedInr)} (${L(y.unaccountedL, lang)} डीज़ल) का हिसाब नहीं मिल रहा: ${list(items)}। बाकी ${others} ट्रिप का हिसाब मिल रहा है।`
      : `Yesterday (${date}) you earned ${inr(y.profitInr)} on ${y.trips} trips. ${inr(y.unaccountedInr)} (${L(y.unaccountedL, lang)} of diesel) doesn't add up, across ${trips.length} trips: ${list(items)}. The other ${others} trips add up.`;
  return { intent: "yesterday_summary", answer, lang, cites: trips };
}

function recovered(lang: Lang): FallbackAnswer {
  const s = september();
  const answer =
    lang === "hi"
      ? `इस महीने ${inr(s.flaggedInr)} के फ़्लैग में से ${inr(s.recoveredInr)} वापस मिले (${s.sharePct}%)।`
      : `This month you have recovered ${inr(s.recoveredInr)} of the ${inr(s.flaggedInr)} flagged (${s.sharePct}%).`;
  return { intent: "recovered", answer, lang, cites: [] };
}

function wrongRate(lang: Lang): FallbackAnswer {
  const s = september();
  const wrong = getDataset().flags.filter((f) => f.status === "wrong" && f.dayKey >= SEPT_FIRST_DAY && f.dayKey <= YESTERDAY_DAY);
  const items = wrong.map((f) => `${f.tripId} (${RULE_LABEL[f.rule][lang]}${f.driverSide.text ? `: “${f.driverSide.text[lang]}”` : ""})`);
  const answer =
    lang === "hi"
      ? `इस महीने ${s.flags} फ़्लैग में से ${s.wrong} ग़लत निकले (${s.wrongPct}%), ${WRONG_FLAG_LIMIT_PCT}% की सीमा से कम: ${list(items)}।`
      : `Urja was wrong ${s.wrong} of ${s.flags} times this month (${s.wrongPct}%), under the ${WRONG_FLAG_LIMIT_PCT}% limit. The driver's side explained ${wrong.length === 2 ? "both" : "each"}: ${list(items)}.`;
  return { intent: "wrong_rate", answer, lang, cites: [...new Set(wrong.map((f) => f.tripId))] };
}

function truckFlags(plate: Plate, yesterdayOnly: boolean, lang: Lang): FallbackAnswer {
  const who = `${plate} (${driverOf(plate, lang)})`;
  const sept = getDataset().flags.filter((f) => f.plate === plate && f.dayKey >= SEPT_FIRST_DAY && f.dayKey <= YESTERDAY_DAY);
  const flags = (yesterdayOnly ? sept.filter((f) => f.dayKey === YESTERDAY_DAY) : sept).sort((a, b) => b.at - a.at);
  if (flags.length > 0) {
    const answer = flags.map((f) => flagSentence(f, lang)).join(" ");
    return { intent: "truck_flags", answer, lang, cites: [...new Set(flags.map((f) => f.tripId))] };
  }
  if (yesterdayOnly) {
    const trips = getDataset().trips.filter((t) => t.plate === plate && dayKey(t.end) === YESTERDAY_DAY);
    const answer =
      trips.length === 0
        ? lang === "hi"
          ? `${who} की कोई ट्रिप कल (${day(YESTERDAY_DAY, lang)}) ख़त्म नहीं हुई, इसलिए कोई फ़्लैग नहीं है।`
          : `No trip of ${who} ended yesterday (${day(YESTERDAY_DAY, lang)}), so there is no flag to show.`
        : lang === "hi"
          ? `कल (${day(YESTERDAY_DAY, lang)}) ${who} की ${trips.length} ट्रिप पर कोई फ़्लैग नहीं: डीज़ल, टोल और किलोमीटर का हिसाब मिल रहा है।`
          : `${who} has no flag on yesterday's ${trips.length === 1 ? "trip" : `${trips.length} trips`} (${day(YESTERDAY_DAY, lang)}): diesel, tolls and km add up.`;
    return { intent: "truck_flags", answer, lang, cites: trips.map((t) => t.id) };
  }
  const row = trucks().find((r) => r.plate === plate);
  const answer =
    lang === "hi"
      ? `सितंबर में ${who} पर कोई फ़्लैग नहीं: ${row?.trips ?? 0} ट्रिप, ${perKm(row?.perKm ?? 0)} प्रति किलोमीटर।`
      : `${who} has no flags in September: ${row?.trips ?? 0} trips at ${perKm(row?.perKm ?? 0)} per km.`;
  return { intent: "truck_flags", answer, lang, cites: [] };
}

/** The deterministic answer for a recognised question, or null (the route then says it is saved). */
export function fallbackAnswer(question: string): FallbackAnswer | null {
  const intent = matchIntent(question);
  if (!intent) return null;
  const lang: Lang = detectLang(question) === "hi" ? "hi" : "en";
  switch (intent.id) {
    case "driver_most_diesel":
      return driverMostDiesel(lang);
    case "last_week_diesel":
      return lastWeekDiesel(lang);
    case "least_per_km":
      return perKmAnswer("least", lang);
    case "best_per_km":
      return perKmAnswer("best", lang);
    case "behror_flags":
      return behrorFlags(lang);
    case "yesterday_summary":
      return yesterdaySummary(lang);
    case "recovered":
      return recovered(lang);
    case "wrong_rate":
      return wrongRate(lang);
    case "truck_flags":
      return truckFlags(intent.plate, intent.yesterdayOnly, lang);
  }
}

