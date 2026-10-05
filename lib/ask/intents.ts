/**
 * Keyword and regex intents for the fallback (technical-plan §6.5). They cover
 * the 10 prepared questions (EVAL-001..010) and close variants in English,
 * Hindi (Devanagari) and Hinglish. Devanagari digits and nukta forms are
 * normalised first. Anything else, including weather, prices, forecasts and
 * requests for the prompt, matches nothing and is saved instead.
 */
import { FLEET } from "@/lib/data/fleet";
import type { Plate } from "@/lib/data/types";
import type { AskLang } from "./contract";
import { devanagariShare, foldNukta, normaliseDigits } from "./text";

export type IntentId =
  | "driver_most_diesel"
  | "last_week_diesel"
  | "least_per_km"
  | "best_per_km"
  | "behror_flags"
  | "yesterday_summary"
  | "truck_flags"
  | "recovered"
  | "wrong_rate";

export type Intent = { id: Exclude<IntentId, "truck_flags"> } | { id: "truck_flags"; plate: Plate; yesterdayOnly: boolean };

/** ASCII digits, nukta folded, lowercase, single spaces. */
export function normaliseQuestion(q: string): string {
  return foldNukta(normaliseDigits(q)).toLowerCase().replace(/\s+/g, " ").trim();
}

// Common Hindi function words and verb endings written in Latin letters. Words
// that are also English ("me", "hi") are left out so English questions stay en.
const HINGLISH =
  /\b(ki|ka|ke|ko|se|kal|mein|kya|hai|hain|tha|thi|kitna|kitne|kitni|kaun|kis|kisne|kaisa|kaisi|kaise|sabse|zyada|jyada|hua|hui|gaya|gayi|wali|wala|batao|bataiye|kyun|kyon|raat|pichhle|hafte|rahega|rahegi|hoga|hogi|mausam|bhav)\b/g;

/**
 * The question's language: Devanagari → hi; Latin with two or more Hindi words
 * → hinglish; else en. Known limit: a one-word Hinglish question ("mausam?")
 * reads as en.
 */
export function detectLang(q: string): AskLang {
  if (devanagariShare(q) >= 0.3) return "hi";
  return (q.toLowerCase().match(HINGLISH) ?? []).length >= 2 ? "hinglish" : "en";
}

/**
 * CR-1 · The language of deterministic copy (saved message, fallback answers,
 * refusals): a Devanagari question is Hindi and a plain English one English,
 * whatever the screen; a Hinglish question (Latin letters, ambiguous script)
 * follows the screen's language, the request's `lang` hint, and is English
 * without one. The model's own answer language is prompt rule 1's, unchanged.
 */
export function copyLang(q: string, hint?: "hi" | "en"): "hi" | "en" {
  const lang = detectLang(q);
  if (lang === "hinglish") return hint ?? "en";
  return lang;
}

// ── Matching helpers ─────────────────────────────────────────────────────
const DEVA = "\\u0900-\\u097F";

/** Any of `words` in `t`: Latin words on \b boundaries, Devanagari words between non-Devanagari characters. */
function has(t: string, ...words: string[]): boolean {
  return words.some((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = /[ऀ-ॿ]/.test(w)
      ? new RegExp(`(^|[^${DEVA}])${escaped}($|[^${DEVA}])`)
      : new RegExp(`\\b${escaped}\\b`);
    return re.test(t);
  });
}

// Keyword sets; Devanagari entries are written nukta-folded (ज्यादा, not ज़्यादा).
// Words that keep a question away from the fallback templates (matchIntent): broad on purpose.
const OFF_TOPIC = ["weather", "mausam", "मौसम", "forecast", "predict", "price", "prices", "bhav", "भाव", "दाम", "होगा", "hoga", "tomorrow", "ignore", "system prompt", "api key", "instructions", "prompt"];

// What offTopicKind refuses: narrow on purpose, so an in-scope question ("did drivers follow
// instructions?", "what diesel price do we use?") falls through to `saved` instead of a refusal.
/** Asks for Urja's own prompt, instructions or a key (EVAL-013). */
const INJECTION_ASKS = [
  /\b(system prompt|api key|secret key|access key)\b/,
  /\bignore (your|all|the|any|these|previous|prior|above)\b/,
  /\byour (instructions|prompt|rules|system|setup|key)\b/,
  /\b(print|reveal|show|repeat|share|tell me)\b.*\b(prompt|instructions)\b/,
];
/** Data no fleet holds: weather, sport. */
const NEVER_IN_DATA = ["weather", "mausam", "मौसम", "rain", "baarish", "barish", "बारिश", "cricket", "क्रिकेट", "match", "score"];
/** A price or rate in the future: a forecast (EVAL-012). The ₹90/L valuation itself is in the data. */
const PRICE_WORDS = ["price", "prices", "rate", "rates", "bhav", "भाव", "दाम", "रेट"];
const FUTURE_WORDS = ["forecast", "predict", "will", "tomorrow", "next week", "next month", "होगा", "होगी", "hoga", "hogi", "rahega", "rahegi", "रहेगा", "रहेगी"];
const YESTERDAY = ["yesterday", "last night", "kal", "कल", "raat", "रात", "last trip"];
const DIESEL = ["diesel", "fuel", "डीजल", "फ्यूल", "तेल", "litre", "litres", "liter", "liters", "लीटर"];
const MOST = ["most", "highest", "maximum", "max", "biggest", "top", "best", "sabse", "सबसे", "zyada", "jyada", "ज्यादा", "अधिक"];
const LEAST = ["least", "lowest", "minimum", "worst", "bottom", "कम", "kam"];
const WHO = ["which", "who", "whose", "driver", "truck", "kaun", "kis", "kisne", "kiska", "कौन", "किस", "किसने", "किसका", "किसकी"];
const PER_KM = /per km|\/ ?km|per kilomet|a km|प्रति (km|किलोमीटर|किमी)|km (par|pe|ke hisab)|किलोमीटर पर/;
const LAST_WEEK = /last week|past week|last 7 days|this week|pichhle hafte|pichle hafte|पिछले (हफ्ते|सप्ताह)|इस हफ्ते|21\s*[–-]\s*27/;
const RECOVERED = /recover|got back|get back|wapas|वापस|वसूल/;
const WRONG = /\bwrong\b|\bgalat\b|गलत|false (alarm|flag|positive)|mistake|\baccura/;
const HOW_OFTEN = ["how often", "how many", "times", "rate", "percent", "urja", "flags", "kitni baar", "कितनी बार", "कितने"];
const EARN = ["earn", "earned", "earnings", "profit", "made", "make", "income", "kamai", "kamaya", "कमाई", "कमाया", "मुनाफा", "munafa", "unaccounted", "add up", "hisab", "हिसाब"];
const BEHROR = ["behror", "बहरोड"];

const PLATE_IN_TEXT = /\bg([abc])\s*-?\s*(\d{4})\b/;

/** The truck a question names, by plate ('RJ14 GB 4521', 'GB 4521') or driver's first name (en or hi). */
export function truckIn(t: string): Plate | null {
  const m = t.match(PLATE_IN_TEXT);
  if (m) {
    const hit = FLEET.find((tr) => tr.plate.toLowerCase().replace(/\s+/g, "").endsWith(`g${m[1]}${m[2]}`));
    if (hit) return hit.plate;
  }
  for (const tr of FLEET) {
    const en = tr.driver.name.en.split(" ")[0].toLowerCase();
    const hi = foldNukta(tr.driver.name.hi.split(" ")[0]);
    if (has(t, en, hi)) return tr.plate;
  }
  return null;
}

/**
 * Why a question is off-topic: `injection` when it asks for the prompt, the
 * instructions or a key; `out_of_scope` when it asks for data the fleet doesn't
 * hold (weather, prices, forecasts); null otherwise. Such a question never
 * matches an intent, and gets a deterministic refusal when the model can't
 * answer (technical-plan §6.5; evaluation-plan §4.7).
 */
export function offTopicKind(question: string): "injection" | "out_of_scope" | null {
  const t = normaliseQuestion(question);
  if (INJECTION_ASKS.some((re) => re.test(t))) return "injection";
  if (has(t, ...NEVER_IN_DATA)) return "out_of_scope";
  if (has(t, ...PRICE_WORDS) && has(t, ...FUTURE_WORDS)) return "out_of_scope";
  if (has(t, "forecast", "predict")) return "out_of_scope";
  return null;
}

/** The intent a question asks for, or null when no fallback template can answer it. */
export function matchIntent(question: string): Intent | null {
  const t = normaliseQuestion(question);
  if (has(t, ...OFF_TOPIC)) return null;

  const plate = truckIn(t);
  if (plate) return { id: "truck_flags", plate, yesterdayOnly: has(t, ...YESTERDAY) };
  if (has(t, ...BEHROR)) return { id: "behror_flags" };
  if (PER_KM.test(t)) {
    if (has(t, ...LEAST) || /सबसे कम|sabse kam/.test(t)) return { id: "least_per_km" };
    if (has(t, ...MOST)) return { id: "best_per_km" };
    return null;
  }
  if (LAST_WEEK.test(t) && (has(t, ...DIESEL) || /missing|unaccounted|gayab|गायब|हिसाब/.test(t))) return { id: "last_week_diesel" };
  if (RECOVERED.test(t)) return { id: "recovered" };
  if (WRONG.test(t) && has(t, ...HOW_OFTEN)) return { id: "wrong_rate" };
  if (has(t, ...DIESEL) && has(t, ...MOST) && has(t, ...WHO)) return { id: "driver_most_diesel" };
  if (has(t, ...YESTERDAY) && has(t, ...EARN)) return { id: "yesterday_summary" };
  return null;
}
