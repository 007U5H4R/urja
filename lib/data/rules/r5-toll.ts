/**
 * R5 · Toll mismatch (technical-plan §4.4).
 * Fires when claims.tollsInr − Σ FASTag ≥ ₹50. ₹ = the difference.
 */
import { R5 } from "../constants";
import type { Flag, Trip } from "../types";
import { toFlag } from "./common";
import { grade } from "./confidence";
import { maxGapMin, noiseBandL, smoothFuelCl } from "./signal";
import { inr } from "./text";

export function detectR5(trip: Trip): Flag[] {
  const fastag = trip.fastag.reduce((a, e) => a + e.inr, 0);
  const diff = trip.claims.tollsInr - fastag;
  if (diff < R5.minDiffInr) return [];
  const s = smoothFuelCl(trip.samples);
  const confidence = grade({
    margin: diff / R5.minDiffInr,
    maxGapMin: maxGapMin(trip.samples, trip.start, trip.end),
    noiseBandL: noiseBandL(trip.samples, s),
  });
  const n = trip.fastag.length;
  return [
    toFlag(trip, "R5", {
      at: trip.end,
      inr: diff,
      confidence,
      evidence: [
        {
          text: {
            en: `Claimed ${inr(trip.claims.tollsInr)} for tolls; FASTag shows ${inr(fastag)} at ${n} ${n === 1 ? "plaza" : "plazas"}`,
            hi: `टोल के ${inr(trip.claims.tollsInr)} माँगे; FASTag में ${n} प्लाज़ा पर ${inr(fastag)}`,
          },
          source: "FASTag",
        },
      ],
      whyConfidence:
        confidence === "high"
          ? {
              en: `FASTag deductions are exact records, and the claim is ${inr(diff)} above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt.`,
              hi: `FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ${inr(diff)} ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें।`,
            }
          : {
              en: `The claim is only ${inr(diff)} above FASTag; a rounding or a cash toll could explain it.`,
              hi: `दावा FASTag से सिर्फ़ ${inr(diff)} ज़्यादा है; नकद टोल से भी ऐसा हो सकता है।`,
            },
    }),
  ];
}
