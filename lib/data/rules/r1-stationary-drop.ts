/**
 * R1 · Stationary fuel drop (technical-plan §4.4).
 *
 * - Candidate windows: runs of samples with speed exactly 0 lasting at least
 *   5 minutes, every sample outside every pump geofence (300 m).
 * - Fuel is smoothed with a 5-sample rolling median.
 * - Fires when some 30-minute span inside the window drops more than 15 L.
 * - litres = round(smoothed fuel at window start − at window end).
 * - `at` (EXE5) is the drop's onset: the last minute smoothed fuel is still within
 *   1 L of the window-start level. `until` is the first minute it is within
 *   1 L of the window-end level, i.e. the last minute it is still falling.
 */
import { dayKey } from "@/lib/clock";
import { DIESEL_INR_PER_L, R1 } from "../constants";
import { distanceToPathM, haversineM } from "../geo";
import { PLACES } from "../places";
import { isLocalRoute, isOnStretch, routeById, STRETCHES, type StretchId } from "../routes";
import type { Evidence, Flag, LngLat, Trip } from "../types";
import { type Detection, type RuleContext, toFlag } from "./common";
import { grade } from "./confidence";
import { maxGapMin, noiseBandL, smoothFuelCl } from "./signal";
import { km1, rangeEn, rangeHi } from "./text";

const PUMPS = PLACES.filter((p) => p.kind === "pump");
const NAMED = PLACES.filter((p) => p.kind === "city" || p.kind === "dhaba");
const NEAR_PLACE_KM = 20;

function nearPump(p: LngLat): boolean {
  return PUMPS.some((pump) => haversineM(p, pump.lngLat) <= (pump.geofenceM ?? R1.pumpGeofenceM));
}

function stretchAt(p: LngLat): StretchId | null {
  for (const id of Object.keys(STRETCHES) as StretchId[]) if (isOnStretch(id, p)) return id;
  return null;
}

/** The place a stationary drop is reported at: its stretch's namesake, else the nearest town or dhaba. */
export function r1PlaceId(p: LngLat): string | undefined {
  const s = stretchAt(p);
  if (s) return STRETCHES[s].centerPlaceId;
  let best: { id: string; m: number } | null = null;
  for (const pl of NAMED) {
    const m = haversineM(p, pl.lngLat);
    if (!best || m < best.m) best = { id: pl.id, m };
  }
  return best && best.m <= NEAR_PLACE_KM * 1000 ? best.id : undefined;
}

function historyLine(trip: Trip, placeId: string | undefined, month: string, ctx: RuleContext): Evidence {
  const others = (ctx.fleetFlags ?? []).filter(
    (f) => f.rule === "R1" && f.tripId !== trip.id && f.placeId === placeId && f.dayKey.startsWith(month),
  ).length;
  const onStretch = placeId !== undefined && Object.values(STRETCHES).some((s) => s.centerPlaceId === placeId);
  let text;
  if (!onStretch) text = { en: "No other drop flagged near here this month", hi: "इस महीने यहाँ आसपास कोई और गिरावट फ़्लैग नहीं हुई" };
  else if (others === 0) text = { en: "First flag on this stretch this month", hi: "इस महीने इस हिस्से पर पहला फ़्लैग" };
  else
    text = {
      en: `Same stretch flagged ${others} more ${others === 1 ? "time" : "times"} this month`,
      hi: `इसी हिस्से पर इस महीने ${others} बार और फ़्लैग हुआ`,
    };
  return { text, source: "Fleet history" };
}

export function detectR1(trip: Trip, ctx: RuleContext = {}): Flag[] {
  const { samples } = trip;
  const n = samples.length;
  if (n === 0) return [];
  const route = routeById(trip.routeId);
  const s = smoothFuelCl(samples);
  const detections: Detection[] = [];
  const { minStopMin: minStop, windowMin } = R1;
  const minDropCl = R1.minDropL * 100;

  let i = 0;
  while (i < n) {
    if (samples[i].speedKmh !== 0 || nearPump(samples[i].lngLat)) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < n && samples[j + 1].speedKmh === 0 && !nearPump(samples[j + 1].lngLat)) j++;
    const i0 = i;
    const i1 = j;
    i = j + 1;
    if (samples[i1].t - samples[i0].t + 1 < minStop) continue;

    let maxDrop = 0;
    for (let a = i0; a <= i1; a++) {
      for (let b = a + 1; b <= i1 && samples[b].t - samples[a].t <= windowMin; b++) {
        maxDrop = Math.max(maxDrop, s[a] - s[b]);
      }
    }
    if (!(maxDrop > minDropCl)) continue;

    const startLevel = s[i0];
    const endLevel = s[i1];
    let atIdx = i0;
    for (let k = i0; k <= i1; k++) {
      if (s[k] <= startLevel - 100) {
        atIdx = Math.max(i0, k - 1);
        break;
      }
    }
    let untilIdx = i1;
    for (let k = atIdx + 1; k <= i1; k++) {
      if (s[k] <= endLevel + 100) {
        untilIdx = k;
        break;
      }
    }
    const litres = Math.round((startLevel - endLevel) / 100);
    const at = samples[atIdx].t;
    const until = samples[untilIdx].t;
    const where = samples[atIdx].lngLat;
    const parkedFrom = samples[i0].t;
    const parkedTo = samples[i1].t + 1;
    const ignitionOff = samples.slice(i0, i1 + 1).some((x) => !x.ignition);
    const offKm = distanceToPathM(where, route.path) / 1000;
    const pumpKm = Math.min(...PUMPS.map((p) => haversineM(where, p.lngLat))) / 1000;
    const road = isLocalRoute(route.id) ? { en: "the planned route", hi: "तय रास्ते" } : { en: "NH48", hi: "NH48" };
    const placeId = r1PlaceId(where);
    const band = noiseBandL(samples, s, [[at, until]]);
    const times = Math.round(litres / Math.max(1, band));
    const confidence = grade({ margin: litres / R1.minDropL, maxGapMin: maxGapMin(samples, parkedFrom, parkedTo - 1), noiseBandL: band });
    const x = Math.round(startLevel / 100);
    const y = Math.round(endLevel / 100);

    const evidence: Evidence[] = [
      { text: { en: `Fuel fell ${x} → ${y} L in ${until - at} minutes`, hi: `${until - at} मिनट में फ़्यूल ${x} → ${y} लीटर गिरा` }, source: "Fuel sensor" },
      {
        text: ignitionOff
          ? { en: `Parked with ignition off, ${rangeEn(parkedFrom, parkedTo)}`, hi: `इग्निशन बंद करके खड़ा था, ${rangeHi(parkedFrom, parkedTo)}` }
          : { en: `Standing with ignition on, ${rangeEn(parkedFrom, parkedTo)}`, hi: `इग्निशन चालू, खड़ा था, ${rangeHi(parkedFrom, parkedTo)}` },
        source: "GPS · ignition",
      },
      {
        text:
          offKm >= 0.1
            ? { en: `${km1(offKm)} km off ${road.en}; nearest pump is ${km1(pumpKm)} km away`, hi: `${road.hi} से ${km1(offKm)} किमी दूर; सबसे नज़दीकी पंप ${km1(pumpKm)} किमी दूर है` }
            : { en: `On ${road.en}; nearest pump is ${km1(pumpKm)} km away`, hi: `${road.hi} पर; सबसे नज़दीकी पंप ${km1(pumpKm)} किमी दूर है` },
        source: "Geofence",
      },
      historyLine(trip, placeId, dayKey(trip.end).slice(0, 7), ctx),
    ];
    const whyConfidence =
      confidence === "high"
        ? {
            en: `The fuel sensor stayed within ±${band} L for the rest of the trip, so a ${litres} L drop is about ${times}× its normal noise.`,
            hi: `बाकी ट्रिप में फ़्यूल सेंसर ±${band} लीटर के अंदर रहा, इसलिए ${litres} लीटर की गिरावट उसके सामान्य उतार-चढ़ाव से लगभग ${times} गुना है।`,
          }
        : {
            en: `A ${litres} L drop is about ${times}× the sensor's ±${band} L noise, which is not a wide enough margin to be sure.`,
            hi: `${litres} लीटर की गिरावट सेंसर के ±${band} लीटर उतार-चढ़ाव से लगभग ${times} गुना है; पक्का कहने के लिए यह अंतर काफ़ी नहीं।`,
          };
    detections.push({ at, until, placeId, litres, inr: litres * DIESEL_INR_PER_L, confidence, evidence, whyConfidence });
  }
  return detections.map((d, k) => toFlag(trip, "R1", d, k + 1));
}

