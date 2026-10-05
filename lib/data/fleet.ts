/**
 * The 24 trucks of Sharma Roadlines (technical-plan §4.3), in anchor rank
 * order (September ₹/km, best first). Ranks are recomputed from the data by
 * the aggregates; this order is the one the anchors expect.
 *
 * Route baselines: each truck has one loaded-highway economy (km/L). Its
 * baseline for a route is plannedKm ÷ km/L, rounded to whole litres and
 * stored in centilitres. The anchors fix three of them:
 *   - Anil (RJ14 GC 3309), JAI-BHW: 1,150 km ÷ 3.54 → 325 L (flag 3: 364 L is +12.0%).
 *   - Ramesh (RJ14 GB 4521), JAI-OKH: 286 km ÷ 3.575 → 80 L (0926-04's 118 L − 38 L).
 *   - Vikram (RJ14 GA 1182), AHM-JAI: 662 km ÷ 3.5 → 189 L.
 * Local Jaipur runs are not stored: `baselineClFor` derives them from the
 * truck's Kishangarh economy at LOCAL_ECONOMY_FACTOR (city driving).
 */
import { INTERCITY_ROUTE_IDS, isLocalRoute, routeById } from "./routes";
import type { Plate, Truck } from "./types";

/** City driving gets this share of the truck's highway km/L. */
const LOCAL_ECONOMY_FACTOR = 0.85;

/** Usual load per route (t), the same for every truck: outbound full, return part-loaded. */
const USUAL_LOAD_T: Record<string, number> = {
  "JAI-OKH": 24, "OKH-JAI": 18,
  "JAI-MAN": 22, "MAN-JAI": 16,
  "JAI-AHM": 22, "AHM-JAI": 20,
  "JAI-BHW": 22, "BHW-JAI": 18,
  "JAI-KSG": 20, "KSG-JAI": 25,
};

type Row = [plate: Plate, en: string, hi: string, since: number, kmPerL: number];

// §4.3, rank 1 → 24.
const ROWS: Row[] = [
  ["RJ14 GC 7710", "Mahesh Meena", "महेश मीणा", 2016, 3.72],
  ["RJ14 GA 2204", "Suresh Yadav", "सुरेश यादव", 2018, 3.68],
  ["RJ14 GB 1450", "Imran Khan", "इमरान ख़ान", 2017, 3.65],
  ["RJ14 GC 0931", "Balwant Singh", "बलवंत सिंह", 2015, 3.7],
  ["RJ14 GA 6618", "Deepak Sharma", "दीपक शर्मा", 2020, 3.62],
  ["RJ14 GB 3087", "Rajesh Saini", "राजेश सैनी", 2019, 3.6],
  ["RJ14 GA 7345", "Mohan Lal Meghwal", "मोहन लाल मेघवाल", 2014, 3.58],
  ["RJ14 GC 1268", "Harish Rawat", "हरीश रावत", 2021, 3.66],
  ["RJ14 GB 5590", "Kamal Kishore", "कमल किशोर", 2018, 3.55],
  ["RJ14 GA 4411", "Prakash Bishnoi", "प्रकाश बिश्नोई", 2017, 3.52],
  ["RJ14 GC 8826", "Salim Qureshi", "सलीम क़ुरैशी", 2016, 3.5],
  ["RJ14 GB 2903", "Gopal Prajapat", "गोपाल प्रजापत", 2022, 3.64],
  ["RJ14 GA 9152", "Naresh Mahawar", "नरेश महावर", 2019, 3.48],
  ["RJ14 GC 4470", "Dinesh Jangid", "दिनेश जांगिड़", 2020, 3.56],
  ["RJ14 GB 6134", "Jagdish Swami", "जगदीश स्वामी", 2013, 3.45],
  ["RJ14 GA 3378", "Rakesh Verma", "राकेश वर्मा", 2018, 3.53],
  ["RJ14 GC 5021", "Ashok Kumawat", "अशोक कुमावत", 2021, 3.6],
  ["RJ14 GB 7716", "Sunil Joshi", "सुनील जोशी", 2019, 3.5],
  ["RJ14 GA 5023", "Rajendra Singh", "राजेंद्र सिंह", 2016, 3.47],
  ["RJ14 GC 2689", "Farhan Ali", "फ़रहान अली", 2022, 3.58],
  ["RJ14 GB 8352", "Bhupendra Rathore", "भूपेंद्र राठौड़", 2017, 3.44],
  ["RJ14 GA 1182", "Vikram Choudhary", "विक्रम चौधरी", 2018, 3.5],
  ["RJ14 GB 4521", "Ramesh Kumar", "रमेश कुमार", 2019, 3.575],
  ["RJ14 GC 3309", "Anil Bairwa", "अनिल बैरवा", 2017, 3.54],
];

const wholeLitresCl = (litres: number) => Math.round(litres) * 100;

function truck([plate, en, hi, since, kmPerL]: Row): Truck {
  const baselineCl: Record<string, number> = {};
  const usualLoadT: Record<string, number> = {};
  for (const id of INTERCITY_ROUTE_IDS) {
    baselineCl[id] = wholeLitresCl(routeById(id).plannedKm / kmPerL);
    usualLoadT[id] = USUAL_LOAD_T[id];
  }
  return { plate, driver: { name: { en, hi }, since }, baselineCl, usualLoadT };
}

/** The 24 trucks, in §4.3 rank order. */
export const FLEET: readonly Truck[] = ROWS.map(truck);

const BY_PLATE = new Map(FLEET.map((t) => [t.plate, t]));

/** The truck with this plate; throws on an unknown plate. */
export function truckByPlate(plate: Plate): Truck {
  const t = BY_PLATE.get(plate);
  if (!t) throw new Error(`Unknown plate: ${plate}`);
  return t;
}

/** This truck's normal diesel for one trip on the route, in centilitres (whole litres). */
export function baselineClFor(truck: Truck, routeId: string): number {
  const stored = truck.baselineCl[routeId];
  if (stored !== undefined) return stored;
  if (isLocalRoute(routeId)) {
    const ksg = routeById("JAI-KSG");
    const highwayKmPerL = ksg.plannedKm / (truck.baselineCl[ksg.id] / 100);
    return wholeLitresCl(routeById(routeId).plannedKm / (highwayKmPerL * LOCAL_ECONOMY_FACTOR));
  }
  throw new Error(`No baseline for ${truck.plate} on ${routeId}`);
}

/** The truck's km per litre on the route, at its baseline. Used for R4's ₹. */
export function kmPerLitre(truck: Truck, routeId: string): number {
  return routeById(routeId).plannedKm / (baselineClFor(truck, routeId) / 100);
}
