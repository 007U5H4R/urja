/**
 * Confidence grading (technical-plan §4.4).
 *
 * - High: the margin over the threshold is at least 2×, no GPS gap over
 *   5 minutes in the flag window, and a sensor noise band ≤ 2.5 L.
 * - Likely: the margin is at least 1.25×.
 * - Check: anything else.
 * A rule-specific cap (R2 → Likely; R3 with a heavier-than-usual load → Check)
 * lowers the grade further; it never raises it.
 */
import type { Bilingual, Confidence } from "../types";

export const CONFIDENCE_THRESHOLDS = { highMargin: 2, likelyMargin: 1.25, maxGapMin: 5, maxNoiseL: 2.5 } as const;

const ORDER: Confidence[] = ["check", "likely", "high"];

export interface ConfidenceInput {
  /** Measured value ÷ the rule's threshold (≥ 1 when the rule fired). */
  margin: number;
  /** Longest gap between samples in the flag window, minutes. */
  maxGapMin: number;
  /** The trip's sensor noise band, whole litres. */
  noiseBandL: number;
  cap?: Confidence;
}

export function grade({ margin, maxGapMin, noiseBandL, cap }: ConfidenceInput): Confidence {
  const t = CONFIDENCE_THRESHOLDS;
  let g: Confidence = "check";
  if (margin >= t.highMargin && maxGapMin <= t.maxGapMin && noiseBandL <= t.maxNoiseL) g = "high";
  else if (margin >= t.likelyMargin) g = "likely";
  if (cap && ORDER.indexOf(cap) < ORDER.indexOf(g)) g = cap;
  return g;
}

/** High / Likely / Check = पक्का / शायद / जाँचें (§1). */
export const CONFIDENCE_WORD: Record<Confidence, Bilingual> = {
  high: { en: "High", hi: "पक्का" },
  likely: { en: "Likely", hi: "शायद" },
  check: { en: "Check", hi: "जाँचें" },
};
