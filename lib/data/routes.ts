/**
 * The route library (technical-plan §4.7).
 *
 * Geometry comes from .design/exploration/final/map.js (NH48_JAI_DEL, AHM_JAI,
 * JAI_BHW). Those polylines are approximate, so a path's length differs from
 * the route's contract distance. `plannedKm` is the contract; the path is
 * mapped onto it by one constant per route:
 *
 *   routeScale(route) = plannedKm / pathLengthKm
 *   pointAtKm(route, km)      → the point (km / scale) km along the path
 *   kmAlongRoute(route, p).km → (distance along the path to p's foot) × scale
 *
 * Every `atKm` below (plazas) is in plannedKm units, and each plaza place
 * sits on the path at that km (tested to ±0.5 km).
 *
 * Every Route this module returns is deep-frozen (route, path, each LngLat,
 * plazas, pumps, stretches), because paths share LngLat references.
 */
import { haversineM, offsetM, pathLengthM, pointAlongPath, projectOntoPath } from "./geo";
import { placeById } from "./places";
import type { Bilingual, LngLat, Plaza, Route } from "./types";

function freezeRoute(r: Route): Route {
  for (const p of r.path) Object.freeze(p);
  Object.freeze(r.path);
  for (const p of r.plazas) Object.freeze(p);
  Object.freeze(r.plazas);
  Object.freeze(r.pumps);
  Object.freeze(r.stretches);
  return Object.freeze(r);
}

// ── Geometry (map.js) ────────────────────────────────────────────────────
/** NH48 Jaipur → Okhla, Delhi (map.js NH48_JAI_DEL). Vertex 9 is Manesar. */
const NH48_JAI_OKH: LngLat[] = [
  [75.787, 26.912], [75.93, 27.14], [75.959, 27.389], [76.08, 27.53], [76.198, 27.703],
  [76.287, 27.888], [76.386, 27.987], [76.44, 28.004], [76.797, 28.206], [76.939, 28.356],
  [77.026, 28.459], [77.12, 28.545], [77.27, 28.53],
];
const NH48_JAI_MAN: LngLat[] = NH48_JAI_OKH.slice(0, 10);
/** Jaipur → Kishangarh → Beawar → Udaipur → Himmatnagar → Ahmedabad (map.js AHM_JAI, reversed). */
const JAI_AHM: LngLat[] = [
  [75.787, 26.912], [75.3, 26.8], [74.86, 26.58], [74.63, 26.45], [74.32, 26.1], [74.1, 25.72],
  [73.9, 25.2], [73.71, 24.58], [73.25, 24.1], [72.96, 23.6], [72.57, 23.02],
];
/** On past Ahmedabad → Vadodara → Bharuch → Surat → Vapi → Bhiwandi (map.js JAI_BHW). */
const JAI_BHW: LngLat[] = [
  ...JAI_AHM,
  [73.18, 22.3], [72.99, 21.7], [72.83, 21.17], [72.9, 20.37], [73.0, 19.8], [73.06, 19.3],
];
const JAI_KSG: LngLat[] = JAI_AHM.slice(0, 3);

// ── Stretches ────────────────────────────────────────────────────────────
export interface Stretch {
  id: string;
  name: Bilingual;
  /** The place the stretch is named after. */
  centerPlaceId: string;
  /** A point within this many km of the centre is on the stretch. */
  radiusKm: number;
}

export const STRETCHES = {
  behror: { id: "behror", name: { en: "Behror stretch", hi: "बहरोड़ वाला हिस्सा" }, centerPlaceId: "behror", radiusKm: 10 },
  udaipur: { id: "udaipur", name: { en: "Udaipur stretch", hi: "उदयपुर वाला हिस्सा" }, centerPlaceId: "udaipur", radiusKm: 40 },
} as const satisfies Record<string, Stretch>;

export type StretchId = keyof typeof STRETCHES;

/** Whether a point lies on a named stretch. */
export function isOnStretch(stretchId: StretchId, p: LngLat): boolean {
  const s = STRETCHES[stretchId];
  return haversineM(placeById(s.centerPlaceId).lngLat, p) / 1000 <= s.radiusKm;
}

// ── Intercity routes ─────────────────────────────────────────────────────
const plaza = (placeId: string, atKm: number, tariffInr: number): Plaza => ({ placeId, atKm, tariffInr });

const FORWARD: Route[] = [
  {
    id: "JAI-OKH", from: "jaipur-tn", to: "okhla", plannedKm: 286, path: NH48_JAI_OKH,
    // 0926-04: Manoharpur at t163 (18 min past the Shahpura dhaba at km 65.8),
    // Shahjahanpur at t386 (just past the Neemrana pump at km 157.4), Kherki Daula at t527.
    plazas: [plaza("manoharpur-plaza", 74, 705), plaza("shahjahanpur-plaza", 165, 725), plaza("kherki-daula-plaza", 255, 710)],
    pumps: ["behror-pump", "neemrana-hp"],
    stretches: ["behror"],
  },
  {
    id: "JAI-MAN", from: "jaipur-tn", to: "manesar", plannedKm: 230, path: NH48_JAI_MAN,
    plazas: [plaza("manoharpur-plaza", 72, 705), plaza("shahjahanpur-plaza", 160, 725)],
    pumps: ["behror-pump", "neemrana-hp"],
    stretches: ["behror"],
  },
  {
    id: "JAI-AHM", from: "jaipur-tn", to: "ahmedabad", plannedKm: 662, path: JAI_AHM,
    plazas: [plaza("bagru-plaza", 31, 420), plaza("beawar-plaza", 215, 610), plaza("udaipur-plaza", 405, 655), plaza("himmatnagar-plaza", 594, 590)],
    pumps: ["kishangarh-pump", "beawar-pump", "udaipur-pump", "himmatnagar-pump"],
    stretches: ["udaipur"],
  },
  {
    id: "JAI-BHW", from: "jaipur-tn", to: "bhiwandi", plannedKm: 1150, path: JAI_BHW,
    plazas: [
      plaza("bagru-plaza", 30, 420), plaza("beawar-plaza", 210, 610), plaza("udaipur-plaza", 395, 655),
      plaza("himmatnagar-plaza", 580, 590), plaza("vadodara-plaza", 780, 540), plaza("bharuch-plaza", 880, 680),
      plaza("vapi-plaza", 1000, 720),
    ],
    pumps: ["kishangarh-pump", "beawar-pump", "udaipur-pump", "himmatnagar-pump", "vadodara-pump", "surat-pump"],
    stretches: ["udaipur"],
  },
  {
    id: "JAI-KSG", from: "jaipur-tn", to: "kishangarh", plannedKm: 105, path: JAI_KSG,
    plazas: [plaza("bagru-plaza", 28, 420)],
    pumps: ["kishangarh-pump"],
    stretches: [],
  },
];

function reverseRoute(r: Route): Route {
  const [a, b] = r.id.split("-");
  return {
    id: `${b}-${a}`,
    from: r.to,
    to: r.from,
    plannedKm: r.plannedKm,
    path: [...r.path].reverse(),
    plazas: [...r.plazas].reverse().map((p) => ({ ...p, atKm: r.plannedKm - p.atKm })),
    pumps: [...r.pumps].reverse(),
    stretches: [...r.stretches],
  };
}

/** The ten intercity routes: each forward route followed by its reverse. */
export const ROUTES: readonly Route[] = Object.freeze(
  FORWARD.flatMap((r) => [r, reverseRoute(r)]).map(freezeRoute),
);

export const INTERCITY_ROUTE_IDS: readonly string[] = Object.freeze(ROUTES.map((r) => r.id));

const NAMES: Record<string, Bilingual> = {
  "JAI-OKH": { en: "Jaipur → Delhi (Okhla)", hi: "जयपुर → दिल्ली (ओखला)" },
  "OKH-JAI": { en: "Delhi (Okhla) → Jaipur", hi: "दिल्ली (ओखला) → जयपुर" },
  "JAI-MAN": { en: "Jaipur → Manesar", hi: "जयपुर → मानेसर" },
  "MAN-JAI": { en: "Manesar → Jaipur", hi: "मानेसर → जयपुर" },
  "JAI-AHM": { en: "Jaipur → Ahmedabad", hi: "जयपुर → अहमदाबाद" },
  "AHM-JAI": { en: "Ahmedabad → Jaipur", hi: "अहमदाबाद → जयपुर" },
  "JAI-BHW": { en: "Jaipur → Bhiwandi", hi: "जयपुर → भिवंडी" },
  "BHW-JAI": { en: "Bhiwandi → Jaipur", hi: "भिवंडी → जयपुर" },
  "JAI-KSG": { en: "Jaipur → Kishangarh", hi: "जयपुर → किशनगढ़" },
  "KSG-JAI": { en: "Kishangarh → Jaipur", hi: "किशनगढ़ → जयपुर" },
};
const LOCAL_NAME: Bilingual = { en: "Jaipur local run", hi: "जयपुर लोकल ट्रिप" };

// ── Local Jaipur runs ────────────────────────────────────────────────────
export const LOCAL_KM_MIN = 20;
export const LOCAL_KM_MAX = 150;
const LOCAL_PREFIX = "JAI-LOC-";
/** City roads wind: the drawn loop is plannedKm / 1.15 long. */
const LOCAL_ROAD_FACTOR = 1.15;
const LOCAL_RING_VERTICES = 12;
/** The loop's centre lies this way from the yard (degrees clockwise from north). */
const LOCAL_BEARING_DEG = 135;
const localCache = new Map<string, Route>();

export function isLocalRoute(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}

/**
 * A local Jaipur run of `km` planned km (20–150): a closed loop that starts
 * and ends at the Jaipur Transport Nagar yard, with no plazas or stretches.
 * Its id is `JAI-LOC-<km>` (km as `String(km)`), and `routeById` returns the
 * same cached, frozen route for that id.
 */
export function localRoute(km: number): Route {
  if (!Number.isFinite(km) || km < LOCAL_KM_MIN || km > LOCAL_KM_MAX) {
    throw new RangeError(`localRoute: km must be ${LOCAL_KM_MIN}–${LOCAL_KM_MAX}, got ${km}`);
  }
  const id = `${LOCAL_PREFIX}${km}`;
  const cached = localCache.get(id);
  if (cached) return cached;
  const yard = placeById("jaipur-tn").lngLat;
  const n = LOCAL_RING_VERTICES;
  const ringM = (km * 1000) / LOCAL_ROAD_FACTOR;
  const r = ringM / (2 * n * Math.sin(Math.PI / n));
  const b = (LOCAL_BEARING_DEG * Math.PI) / 180;
  const center = offsetM(yard, r * Math.sin(b), r * Math.cos(b));
  // Angle (east = 0, counter-clockwise) from the centre back to the yard.
  const start = Math.atan2(-Math.cos(b), -Math.sin(b));
  const path: LngLat[] = [[...yard]];
  for (let k = 1; k < n; k++) {
    const a = start + (2 * Math.PI * k) / n;
    path.push(offsetM(center, r * Math.cos(a), r * Math.sin(a)));
  }
  path.push([...yard]);
  const route = freezeRoute({
    id,
    from: "jaipur-tn",
    to: "jaipur-tn",
    plannedKm: km,
    path,
    plazas: [],
    pumps: [],
    stretches: [],
  });
  localCache.set(id, route);
  return route;
}

// ── Lookup and km mapping ────────────────────────────────────────────────
const BY_ID = new Map(ROUTES.map((r) => [r.id, r]));

/** The route with this id (intercity, or `JAI-LOC-<km>`); throws on an unknown id. */
export function routeById(id: string): Route {
  const r = BY_ID.get(id);
  if (r) return r;
  if (isLocalRoute(id)) {
    // Only canonical ids: 'JAI-LOC-73', never 'JAI-LOC-073' or 'JAI-LOC-73.0'.
    const suffix = id.slice(LOCAL_PREFIX.length);
    const km = Number(suffix);
    if (suffix !== "" && String(km) === suffix && km >= LOCAL_KM_MIN && km <= LOCAL_KM_MAX) {
      return localRoute(km);
    }
  }
  throw new Error(`Unknown route id: ${id}`);
}

/** The route's display name; throws on an unknown id. */
export function routeName(id: string): Bilingual {
  const route = routeById(id);
  return isLocalRoute(route.id) ? LOCAL_NAME : NAMES[route.id];
}

/** plannedKm per km of drawn path. */
export function routeScale(route: Route): number {
  return route.plannedKm / (pathLengthM(route.path) / 1000);
}

/** The point `km` planned km from the route's start (clamped to its ends). */
export function pointAtKm(route: Route, km: number): LngLat {
  if (!Number.isFinite(km)) throw new RangeError(`pointAtKm: non-finite km ${km}`);
  if (km <= 0) return [...route.path[0]];
  if (km >= route.plannedKm) return [...route.path[route.path.length - 1]];
  return pointAlongPath(route.path, (km * 1000) / routeScale(route));
}

/**
 * Where `p` falls along the route, in planned km, and how far off the path it is (metres).
 * It is the nearest point on the whole path, with no notion of direction or
 * progress: on a closed `JAI-LOC-*` loop the yard is both km 0 and the last km,
 * so do not use it to track progress there (use the trip's own distance).
 */
export function kmAlongRoute(route: Route, p: LngLat): { km: number; offPathM: number } {
  const proj = projectOntoPath(p, route.path);
  return { km: (proj.alongM / 1000) * routeScale(route), offPathM: proj.distanceM };
}
