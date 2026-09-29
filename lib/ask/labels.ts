/**
 * Bilingual labels shared by the Ask context (what the model reads) and the
 * fallback templates (what the owner reads when the model can't answer), so
 * both describe a flag the same way.
 */
import { tripById, type ReadonlyFlag } from "@/lib/data";
import { placeById } from "@/lib/data/places";
import { routeName } from "@/lib/data/routes";
import { CONFIDENCE_WORD } from "@/lib/data/rules";
import type { Bilingual, Confidence, FlagStatus, Lang, RuleId } from "@/lib/data/types";
import { formatDateIST, formatTimeIST } from "@/lib/format";

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
  confirmed: { en: "confirmed", hi: "पक्का किया" },
  wrong: { en: "marked wrong", hi: "ग़लत निकला" },
};

export function confidenceWord(c: Confidence, lang: Lang): string {
  return CONFIDENCE_WORD[c][lang];
}

/** The flag's place name, or null for whole-trip rules. */
export function flagPlace(f: ReadonlyFlag, lang: Lang): string | null {
  return f.placeId ? placeById(f.placeId).name[lang] : null;
}

/** '27 Sep' from a 'YYYY-MM-DD' day key. */
export function dayLabel(dayKey: string): string {
  const [, m, d] = dayKey.split("-").map(Number);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${MONTHS[m - 1]}`;
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

/** 'RJ14 GB 4521 · Jaipur → Okhla, Delhi': the label on a cited trip. */
export function tripLabel(tripId: string, lang: Lang): string {
  const t = tripById(tripId);
  return `${t.plate} · ${routeName(t.routeId)[lang]}`;
}
