import type { Lang } from "@/lib/data/types";
import { ASK_COPY } from "./copy";

/** 'gemini-3.5-flash' → 'Gemini 3.5 Flash': the model id from provenance, as the owner reads it. */
export function modelLabel(model: string): string {
  return model
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** 1800 → '1.8', 40 → '0.04': the measured time in seconds (two decimals under 0.1 s, so it never reads 0.0). */
export function seconds(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  return s > 0 && s < 0.1 ? s.toFixed(2) : s.toFixed(1);
}

/**
 * "From 212 trips across 24 trucks, 1–27 Sep · Gemini 3.5 Flash · answered in 1.8 s ·
 * Urja can be wrong, so open the trips before acting." (§6.6). A fallback answer has
 * no model, and says it came straight from the data instead. On a Hindi screen
 * (EXE23) the line is Hindi; `scope` is then the Hindi scope.
 */
export function provenanceLine(p: { scope: string; model: string | null; ms: number }, lang: Lang = "en"): string {
  const c = ASK_COPY[lang];
  const parts = [
    p.scope ? c.from(p.scope) : null,
    p.model ? modelLabel(p.model) : c.noModel,
    c.answeredIn(seconds(p.ms)),
    c.canBeWrong,
  ];
  return parts.filter(Boolean).join(" · ");
}

/** Devanagari anywhere → Hindi; used for the `lang` of the question bubble. */
export function textLang(s: string): "hi" | "en" {
  return /[ऀ-ॿ]/.test(s) ? "hi" : "en";
}
