/**
 * R4 · Route deviation (technical-plan §4.4).
 *
 * - Fires when actualKm > plannedKm × 1.06, or when a contiguous stretch
 *   driven more than 500 m off the route path is longer than 10 km.
 * - ₹ = extra km × ₹90 ÷ the truck's km/L on the route, rounded to ₹10.
 *   Extra km is actual − planned when the distance test fires; when only the
 *   off-path test fires, it is the off-path stretch's length.
 */
import { DIESEL_INR_PER_L, R4, r4OverKmFires } from "../constants";
import { kmPerLitre, truckByPlate } from "../fleet";
import { haversineM } from "../geo";
import { routeById } from "../routes";
import type { Flag, LngLat, Min, Trip } from "../types";
import { toFlag } from "./common";
import { grade } from "./confidence";
import { maxGapMin, noiseBandL, smoothFuelCl } from "./signal";
import { inr, km1, kmWhole, timeEn, timeHi } from "./text";

export interface RouteDeviation {
  extraKm: number;
  offPathKm: number;
  offPathFrom: Min | null;
  offPathTo: Min | null;
}

/**
 * Distance from a point to a polyline, metres. The nearest segment is picked
 * on an equirectangular plane around the point (cheap); only the winner's
 * foot is measured with haversine.
 */
export function offPathM(p: LngLat, path: readonly LngLat[]): number {
  return nearestOnPath(p, path, 1, path.length - 1).m;
}

/** Nearest foot on segments [from, to] (1-based: segment i joins vertices i−1 and i). */
function nearestOnPath(p: LngLat, path: readonly LngLat[], from: number, to: number): { m: number; seg: number } {
  const kx = Math.cos((p[1] * Math.PI) / 180);
  const px = p[0];
  const py = p[1];
  let best = Infinity;
  let bi = from;
  let bt = 0;
  for (let i = from; i <= to; i++) {
    const a = path[i - 1];
    const b = path[i];
    const ax = (a[0] - px) * kx;
    const ay = a[1] - py;
    const dx = (b[0] - a[0]) * kx;
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const ex = ax + t * dx;
    const ey = ay + t * dy;
    const d2 = ex * ex + ey * ey;
    if (d2 < best) {
      best = d2;
      bi = i;
      bt = t;
    }
  }
  const a = path[bi - 1];
  const b = path[bi];
  return { m: haversineM(p, [a[0] + bt * (b[0] - a[0]), a[1] + bt * (b[1] - a[1])]), seg: bi };
}

/** Measures the trip against its plan; `null` when R4 does not fire. */
export function measureDeviation(trip: Trip): RouteDeviation | null {
  const route = routeById(trip.routeId);
  let best = { km: 0, from: null as Min | null, to: null as Min | null };
  let cur = { km: 0, from: null as Min | null };
  const path = route.path;
  const limitM = R4.offPathM;
  const last = path.length - 1;
  // Samples move along the path, so first look near the previous nearest
  // segment; a sample that looks off the path there gets a full scan, so the
  // answer is the same as a full scan every time.
  let hint = 1;
  const isOff = (p: LngLat) => {
    const near = nearestOnPath(p, path, Math.max(1, hint - 1), Math.min(last, hint + 1));
    if (near.m <= limitM) {
      hint = near.seg;
      return false;
    }
    const full = nearestOnPath(p, path, 1, last);
    hint = full.seg;
    return full.m > limitM;
  };
  // A run's length is the distance driven between its first and last off-path fix.
  let prevSpeed = 0;
  for (const s of trip.samples) {
    const off = isOff(s.lngLat);
    if (off) {
      if (cur.from === null) cur = { km: 0, from: s.t };
      else cur.km += prevSpeed / 60;
      if (cur.km > best.km) best = { km: cur.km, from: cur.from, to: s.t };
    } else cur = { km: 0, from: null };
    prevSpeed = s.speedKmh;
  }
  const overKm = r4OverKmFires(trip.actualKm, route.plannedKm);
  const detour = best.km > R4.detourKm;
  if (!overKm && !detour) return null;
  const extraKm = overKm ? trip.actualKm - route.plannedKm : best.km;
  return { extraKm, offPathKm: best.km, offPathFrom: best.from, offPathTo: best.to };
}

/** Diesel the extra km would burn at the truck's usual economy, centilitres. */
export function extraKmCl(trip: Trip, extraKm: number): number {
  return Math.round((extraKm * 100) / kmPerLitre(truckByPlate(trip.plate), trip.routeId));
}

/** R4 flags for a trip; pass `dev` when it is already measured (detectFlags measures once). */
export function detectR4(trip: Trip, dev: RouteDeviation | null = measureDeviation(trip)): Flag[] {
  if (!dev) return [];
  const route = routeById(trip.routeId);
  const kmpl = kmPerLitre(truckByPlate(trip.plate), trip.routeId);
  const rupees = Math.round((dev.extraKm * DIESEL_INR_PER_L) / kmpl / 10) * 10;
  const pct = Math.round(((trip.actualKm - route.plannedKm) / route.plannedKm) * 100);
  const margin = Math.max(
    (trip.actualKm - route.plannedKm) / ((route.plannedKm * R4.overPct) / 100),
    dev.offPathKm / R4.detourKm,
  );
  const s = smoothFuelCl(trip.samples);
  const confidence = grade({
    margin,
    maxGapMin: maxGapMin(trip.samples, trip.start, trip.end),
    noiseBandL: noiseBandL(trip.samples, s),
  });
  const actual = Math.round(trip.actualKm);
  const evidence: Flag["evidence"] = [
    {
      text: {
        en: `Drove ${kmWhole(actual)} km against a planned ${kmWhole(route.plannedKm)} km (${pct >= 0 ? "+" : ""}${pct}%)`,
        hi: `तय ${kmWhole(route.plannedKm)} किमी की जगह ${kmWhole(actual)} किमी चला (${pct >= 0 ? "+" : ""}${pct}%)`,
      },
      source: "Trip plan",
    },
  ];
  if (dev.offPathKm >= 0.5 && dev.offPathFrom !== null && dev.offPathTo !== null) {
    evidence.push({
      text: {
        en: `Left the planned route for ${km1(dev.offPathKm)} km, ${timeEn(dev.offPathFrom)} to ${timeEn(dev.offPathTo)}`,
        hi: `${timeHi(dev.offPathFrom)} से ${timeHi(dev.offPathTo)} तक ${km1(dev.offPathKm)} किमी तय रास्ते से हटकर चला`,
      },
      source: "Geofence",
    });
  }
  evidence.push({
    text: {
      en: `${km1(dev.extraKm)} extra km at this truck's ${kmpl.toFixed(2)} km/L = ${inr(rupees)} of diesel`,
      hi: `${km1(dev.extraKm)} किमी ज़्यादा, इस ट्रक के ${kmpl.toFixed(2)} किमी/लीटर पर = ${inr(rupees)} का डीज़ल`,
    },
    source: "Fleet history",
  });
  return [
    toFlag(trip, "R4", {
      at: dev.offPathFrom ?? trip.start,
      until: dev.offPathTo ?? trip.end,
      inr: rupees,
      confidence,
      evidence,
      whyConfidence:
        confidence === "high"
          ? { en: "GPS tracked the whole trip with no gaps, and the extra distance is well past the 6% allowance.", hi: "GPS ने पूरी ट्रिप बिना रुकावट दर्ज की, और ज़्यादा दूरी 6% की सीमा से काफ़ी ऊपर है।" }
          : { en: "The extra distance is only a little past the 6% allowance; a closed road or a diversion would explain it.", hi: "ज़्यादा दूरी 6% की सीमा से थोड़ी ही ऊपर है; बंद सड़क या डायवर्ज़न से भी ऐसा हो सकता है।" },
    }),
  ];
}
