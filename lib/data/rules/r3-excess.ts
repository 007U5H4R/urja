/**
 * R3 · Excess consumption (technical-plan §4.4, TP3).
 *
 * - `used` = the trip's diesel (tank start + Σ rises − tank end, plus any R2
 *   short-filled litres, as the ledger counts it) minus the R1 and R2 litres,
 *   so the same litres are never flagged twice. Because R2's litres never
 *   reached the tank, this equals tank consumption − R1 litres.
 * - EXE4: it also subtracts the diesel an R4 detour's extra km
 *   explain, for the same reason (N14's 260 km police diversion would
 *   otherwise also read as +22% excess).
 * - Fires when used ≥ 1.12 × baselineCl[route] (inclusive). litres = used − baseline.
 * - Load isn't part of the baseline: if loadT exceeds usualLoadT[route],
 *   confidence is at most Check.
 */
import { DIESEL_INR_PER_L, R3, r3Fires } from "../constants";
import { baselineClFor, truckByPlate } from "../fleet";
import type { Flag, Trip } from "../types";
import { toFlag } from "./common";
import { grade } from "./confidence";
import { maxGapMin, noiseBandL, smoothFuelCl } from "./signal";

export interface R3Prior {
  /** Litres already flagged by R1 on this trip. */
  r1Cl: number;
  /** Diesel explained by an R4 detour's extra km, centilitres. */
  r4Cl: number;
}

/** Tank consumption: start + Σ rises − end, centilitres. */
export function tankUsedCl(trip: Trip): number {
  return trip.tank.startCl + trip.refuels.reduce((a, r) => a + r.tankRiseCl, 0) - trip.tank.endCl;
}

export function detectR3(trip: Trip, prior: R3Prior = { r1Cl: 0, r4Cl: 0 }): Flag[] {
  const truck = truckByPlate(trip.plate);
  const baseline = baselineClFor(truck, trip.routeId);
  const used = tankUsedCl(trip) - prior.r1Cl - prior.r4Cl;
  if (!r3Fires(used, baseline)) return [];
  const excessCl = used - baseline;
  const litres = Math.round(excessCl / 100);
  const usual = truck.usualLoadT[trip.routeId];
  const heavy = usual !== undefined && trip.loadT > usual;
  const s = smoothFuelCl(trip.samples);
  const band = noiseBandL(trip.samples, s);
  const margin = excessCl / (baseline * (R3.overRatio - 1));
  const confidence = grade({
    margin,
    maxGapMin: maxGapMin(trip.samples, trip.start, trip.end),
    noiseBandL: band,
    cap: heavy ? "check" : undefined,
  });
  const usedL = Math.round(used / 100);
  const baseL = Math.round(baseline / 100);
  const pct = Math.round((excessCl / baseline) * 100);
  const evidence: Flag["evidence"] = [
    {
      text: {
        en: `Used ${usedL} L; this truck's normal on this route is ${baseL} L (${pct}% more)`,
        hi: `${usedL} लीटर लगा; इस रूट पर इस ट्रक का आम खर्च ${baseL} लीटर है (${pct}% ज़्यादा)`,
      },
      source: "Fleet history",
    },
  ];
  if (prior.r1Cl === 0) {
    evidence.push({ text: { en: "Spread across the trip, no single stop", hi: "पूरी ट्रिप में फैला हुआ, किसी एक जगह नहीं" }, source: "Fuel sensor" });
  }
  evidence.push({
    text: heavy
      ? { en: `Load ${trip.loadT} t (usual ${usual} t)`, hi: `लोड ${trip.loadT} टन (आम तौर पर ${usual} टन)` }
      : { en: `Load ${trip.loadT} t, within the usual ${usual ?? trip.loadT} t`, hi: `लोड ${trip.loadT} टन, आम ${usual ?? trip.loadT} टन के अंदर` },
    source: "Trip plan",
  });
  const whyConfidence = heavy
    ? {
        en: `Check: the truck carried ${trip.loadT} t against a usual ${usual} t, and the normal doesn't allow for load, so the extra diesel may be the load.`,
        hi: `जाँचें: ट्रक में आम ${usual} टन की जगह ${trip.loadT} टन था, और आम खर्च में लोड नहीं जुड़ता, इसलिए ज़्यादा डीज़ल लोड की वजह से भी हो सकता है।`,
      }
    : confidence === "high"
      ? {
          en: `${litres} L over normal is more than twice the 12% allowance, with a steady sensor and no GPS gaps.`,
          hi: `आम से ${litres} लीटर ज़्यादा, 12% की छूट के दोगुने से भी ऊपर है; सेंसर स्थिर और GPS में कोई रुकावट नहीं।`,
        }
      : {
          en: `${litres} L over normal is close to the 12% allowance; slow ghats or traffic could explain part of it.`,
          hi: `आम से ${litres} लीटर ज़्यादा, 12% की छूट के करीब है; घाट या जाम से भी कुछ हिस्सा हो सकता है।`,
        };
  return [
    toFlag(trip, "R3", {
      at: trip.start,
      until: trip.end,
      litres,
      inr: litres * DIESEL_INR_PER_L,
      confidence,
      evidence,
      whyConfidence,
    }),
  ];
}
