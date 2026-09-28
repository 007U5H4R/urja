/**
 * R2 · Refuel mismatch (technical-plan §4.4).
 *
 * - rise = smoothed fuel 10 min after the bill − smoothed fuel 5 min before it.
 * - Fires when billed > rise × 1.08. litres = round(billed − rise).
 * - Confidence is capped at Likely: a bill can cover cans or a second tank,
 *   and the prototype has no pump-meter record.
 */
import { DIESEL_INR_PER_L, R2, r2Fires } from "../constants";
import { placeById } from "../places";
import type { Flag, Trip } from "../types";
import { type Detection, toFlag } from "./common";
import { grade } from "./confidence";
import { indexAt, maxGapMin, noiseBandL, smoothFuelCl } from "./signal";
import { inr, timeEn, timeHi } from "./text";

export const R2_BEFORE_MIN = 5;
export const R2_AFTER_MIN = 10;

export function detectR2(trip: Trip): Flag[] {
  const { samples } = trip;
  if (samples.length === 0 || trip.refuels.length === 0) return [];
  const s = smoothFuelCl(samples);
  const detections: Detection[] = [];
  for (const bill of trip.refuels) {
    const a = indexAt(samples, bill.t - R2_BEFORE_MIN);
    const b = indexAt(samples, bill.t + R2_AFTER_MIN);
    if (a < 0 || b < 0) continue;
    const rise = s[b] - s[a];
    if (!r2Fires(bill.billedCl, rise)) continue;
    const litres = Math.round((bill.billedCl - rise) / 100);
    const pump = placeById(bill.placeId);
    const band = noiseBandL(samples, s, [[bill.t - R2_BEFORE_MIN, bill.t + R2_AFTER_MIN + 3]]);
    const margin = rise > 0 ? (bill.billedCl - rise) / ((rise * R2.overPct) / 100) : Infinity;
    const confidence = grade({
      margin,
      maxGapMin: maxGapMin(samples, bill.t - R2_BEFORE_MIN, bill.t + R2_AFTER_MIN),
      noiseBandL: band,
      cap: "likely",
    });
    const billedL = Math.round(bill.billedCl / 100);
    const riseL = Math.round(rise / 100);
    detections.push({
      at: bill.t,
      placeId: bill.placeId,
      litres,
      inr: litres * DIESEL_INR_PER_L,
      confidence,
      evidence: [
        {
          text: { en: `Bill says ${billedL} L (${inr(bill.billedInr)}); the tank rose ${riseL} L`, hi: `बिल में ${billedL} लीटर (${inr(bill.billedInr)}); टैंक में ${riseL} लीटर बढ़ा` },
          source: "Fuel bill",
        },
        {
          text: { en: `Tank read ${R2_BEFORE_MIN} min before and ${R2_AFTER_MIN} min after the fill`, hi: `टैंक भरने से ${R2_BEFORE_MIN} मिनट पहले और ${R2_AFTER_MIN} मिनट बाद पढ़ा गया` },
          source: "Fuel sensor",
        },
        {
          text: { en: `${pump.name.en}, ${timeEn(bill.t)}`, hi: `${pump.name.hi}, ${timeHi(bill.t)}` },
          source: "Geofence",
        },
      ],
      whyConfidence:
        confidence === "likely"
          ? {
              en: "Capped at Likely: a bill can also cover cans or a second tank, and there is no pump-meter record to check against.",
              hi: "‘शायद’ से ऊपर नहीं: बिल में कैन या दूसरे टैंक का डीज़ल भी हो सकता है, और पंप-मीटर का रिकॉर्ड नहीं है।",
            }
          : {
              en: `The bill is only ${litres} L above the tank's rise, a narrow margin over the 8% allowance.`,
              hi: `बिल टैंक की बढ़त से सिर्फ़ ${litres} लीटर ज़्यादा है; 8% की छूट से यह अंतर कम है।`,
            },
    });
  }
  return detections.map((d, k) => toFlag(trip, "R2", d, k + 1));
}
