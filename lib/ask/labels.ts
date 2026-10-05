/**
 * Bilingual labels shared by the Ask context (what the model reads) and the
 * fallback templates (what the owner reads when the model can't answer), so
 * both describe a flag the same way.
 */
import { dayKey } from "@/lib/clock";
import { getDataset, tripById, type ReadonlyFlag } from "@/lib/data";
import { placeById } from "@/lib/data/places";
import { routeName } from "@/lib/data/routes";
import { CONFIDENCE_WORD } from "@/lib/data/rules";
import type { Bilingual, Confidence, FlagStatus, Lang, RuleId } from "@/lib/data/types";
import { formatDateIST, formatTimeIST } from "@/lib/format";
import { MONTHS_EN, MONTHS_HI } from "@/lib/brief/dict";

/** Rule names as the owner reads them (Hindi pending the native review, docs/exec/hindi-review.md). */
export const RULE_LABEL: Record<RuleId, Bilingual> = {
  R1: { en: "Stationary fuel drop", hi: "खड़े ट्रक में डीज़ल घटा" },
  R2: { en: "Refuel mismatch", hi: "बिल और टंकी में फ़र्क" },
  R3: { en: "Excess consumption", hi: "सामान्य से ज़्यादा डीज़ल" },
  R4: { en: "Route deviation", hi: "तय रास्ते से हटकर" },
  R5: { en: "Toll mismatch", hi: "टोल में फ़र्क" },
};

export const STATUS_LABEL: Record<FlagStatus, Bilingual> = {
  waiting: { en: "waiting for you", hi: "आपके फ़ैसले का इंतज़ार" },
  // Not "पक्का किया": पक्का is the High confidence word (DES-22).
  confirmed: { en: "confirmed", hi: "आपने माना" },
  wrong: { en: "marked wrong", hi: "ग़लत निकला" },
};

export function confidenceWord(c: Confidence, lang: Lang): string {
  return CONFIDENCE_WORD[c][lang];
}

/** The flag's place name, or null for whole-trip rules. */
export function flagPlace(f: ReadonlyFlag, lang: Lang): string | null {
  return f.placeId ? placeById(f.placeId).name[lang] : null;
}

/** '27 Sep' from a 'YYYY-MM-DD' day key; '27 सितंबर' with lang 'hi' (month names from lib/brief/dict.ts). */
export function dayLabel(key: string, lang: Lang = "en"): string {
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${lang === "hi" ? MONTHS_HI[m - 1] : MONTHS_EN[m - 1].slice(0, 3)}`;
}

/** When the flag happened: '27 Sep 2:14–2:40 AM', '27 Sep 4:50 PM', or 'whole trip' for R3. */
export function flagWhen(f: ReadonlyFlag): string {
  if (f.rule === "R3") return "whole trip";
  const day = formatDateIST(f.at, "day-month");
  const a = formatTimeIST(f.at);
  if (f.until === undefined) return `${day} ${a}`;
  const b = formatTimeIST(f.until);
  const sameDay = formatDateIST(f.until, "day-month") === day;
  const [at, am] = a.split(" ");
  const [bt, bm] = b.split(" ");
  if (sameDay && am === bm) return `${day} ${at}–${bt} ${bm}`;
  return sameDay ? `${day} ${a}–${b}` : `${day} ${a} – ${formatDateIST(f.until, "day-month")} ${b}`;
}

/** Litres with Indian grouping, as the fallback writes them: '1,250 L' / '1,250 लीटर'. */
const litres = (n: number, lang: Lang) => {
  const v = new Intl.NumberFormat("en-IN").format(n);
  return lang === "hi" ? `${v} लीटर` : `${v} L`;
};

/** What a flag on the trip was: '38 L · Stationary fuel drop', or the rule alone when it has no litres. */
function flagPart(f: ReadonlyFlag, lang: Lang): string {
  const rule = RULE_LABEL[f.rule][lang];
  return f.litres ? `${litres(f.litres, lang)} · ${rule}` : rule;
}

/**
 * The label on a cited trip (final/index.html `.drawer .a ol li`): the route,
 * the day it started, and what each flag on it was, so two trips on one route
 * can be told apart (DES-17).
 * 'Jaipur → Bhiwandi, 26 Sep: 39 L · Excess consumption'; 'Jaipur → Ahmedabad, 26 Sep' with no flag.
 * `withPlate` puts the truck first ('RJ14 GB 4521 · …'), for cites that span trucks.
 */
export function tripLabel(tripId: string, lang: Lang, withPlate = false): string {
  const t = tripById(tripId);
  const flags = getDataset().flags.filter((f) => f.tripId === tripId);
  const head = `${routeName(t.routeId)[lang]}, ${dayLabel(dayKey(t.start), lang)}`;
  const label = flags.length ? `${head}: ${flags.map((f) => flagPart(f, lang)).join("; ")}` : head;
  return withPlate ? `${t.plate} · ${label}` : label;
}

/** Labels for a response's cites; the plate shows only when they span more than one truck. */
export function citeLabels(tripIds: readonly string[], lang: Lang): { tripId: string; label: string }[] {
  const plates = new Set(tripIds.map((id) => tripById(id).plate));
  return tripIds.map((id) => ({ tripId: id, label: tripLabel(id, lang, plates.size > 1) }));
}
