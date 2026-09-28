/**
 * Every place the mockups name, plus the pumps and plazas the route library
 * needs. Coordinates are seeded from .design/exploration/final/map.js `P`;
 * plazas and the extra pumps sit on the route paths (see routes.ts), and
 * were placed with `pointAtKm` on the route they belong to.
 */
import { R1 } from "./constants";
import type { LngLat, Place } from "./types";

const YARD_GEOFENCE_M = 500;
const DHABA_GEOFENCE_M = 200;

const place = (
  id: string,
  kind: Place["kind"],
  en: string,
  hi: string,
  lngLat: LngLat,
  geofenceM?: number,
): Place => (geofenceM === undefined ? { id, name: { en, hi }, lngLat, kind } : { id, name: { en, hi }, lngLat, kind, geofenceM });

const pump = (id: string, en: string, hi: string, lngLat: LngLat) =>
  place(id, "pump", en, hi, lngLat, R1.pumpGeofenceM);

export const PLACES: readonly Place[] = [
  // Cities (map.js P)
  place("jaipur", "city", "Jaipur", "जयपुर", [75.787, 26.912]),
  place("delhi", "city", "Delhi", "दिल्ली", [77.21, 28.61]),
  place("behror", "city", "Behror", "बहरोड़", [76.255, 27.869]),
  place("kishangarh", "city", "Kishangarh", "किशनगढ़", [74.86, 26.58], YARD_GEOFENCE_M),
  place("beawar", "city", "Beawar", "ब्यावर", [74.32, 26.1]),
  place("udaipur", "city", "Udaipur", "उदयपुर", [73.71, 24.58]),
  place("himmatnagar", "city", "Himmatnagar", "हिम्मतनगर", [72.96, 23.6]),
  place("ahmedabad", "city", "Ahmedabad", "अहमदाबाद", [72.57, 23.02], YARD_GEOFENCE_M),
  place("vadodara", "city", "Vadodara", "वडोदरा", [73.18, 22.3]),
  place("bharuch", "city", "Bharuch", "भरूच", [72.99, 21.7]),
  place("surat", "city", "Surat", "सूरत", [72.83, 21.17]),
  place("vapi", "city", "Vapi", "वापी", [72.9, 20.37]),
  place("mumbai", "city", "Mumbai", "मुंबई", [72.87, 19.07]),

  // Yards and depots (trip ends; "yard · …" chips)
  place("jaipur-tn", "yard", "Jaipur Transport Nagar", "जयपुर ट्रांसपोर्ट नगर", [75.787, 26.912], YARD_GEOFENCE_M),
  place("okhla", "depot", "Okhla, Delhi", "ओखला, दिल्ली", [77.27, 28.53], YARD_GEOFENCE_M),
  place("manesar", "depot", "Manesar", "मानेसर", [76.939, 28.356], YARD_GEOFENCE_M),
  place("bhiwandi", "depot", "Bhiwandi", "भिवंडी", [73.06, 19.3], YARD_GEOFENCE_M),

  // NH48 Jaipur → Delhi (0926-04's timeline)
  place("shahpura-dhaba", "dhaba", "Shahpura dhaba", "शाहपुरा ढाबा", [75.959, 27.389], DHABA_GEOFENCE_M),
  place("manoharpur-plaza", "plaza", "Manoharpur plaza", "मनोहरपुर टोल प्लाज़ा", [76.0027, 27.43992]),
  pump("behror-pump", "Behror highway pump", "बहरोड़ हाईवे पंप", [76.28493, 27.8837]),
  pump("neemrana-hp", "HP pump Neemrana", "एचपी पंप नीमराना", [76.386, 27.987]),
  place("shahjahanpur-plaza", "plaza", "Shahjahanpur plaza", "शाहजहाँपुर टोल प्लाज़ा", [76.44818, 28.00863]),
  place("kherki-daula-plaza", "plaza", "Kherki Daula plaza", "खेड़की दौला टोल प्लाज़ा", [77.0345, 28.46678]),

  // Jaipur → Kishangarh → Udaipur → Ahmedabad → Bhiwandi
  place("bagru-plaza", "plaza", "Bagru plaza", "बगरू टोल प्लाज़ा", [75.52674, 26.85215]),
  pump("kishangarh-pump", "Kishangarh pump", "किशनगढ़ पंप", [74.86, 26.58]),
  place("beawar-plaza", "plaza", "Beawar plaza", "ब्यावर टोल प्लाज़ा", [74.28573, 26.0408]),
  pump("beawar-pump", "Beawar pump", "ब्यावर पंप", [74.12373, 25.76098]),
  place("udaipur-plaza", "plaza", "Udaipur plaza", "उदयपुर टोल प्लाज़ा", [73.73851, 24.67302]),
  pump("udaipur-pump", "Udaipur pump", "उदयपुर पंप", [73.58042, 24.44479]),
  pump("himmatnagar-pump", "Himmatnagar pump", "हिम्मतनगर पंप", [72.91396, 23.53153]),
  place("himmatnagar-plaza", "plaza", "Himmatnagar plaza", "हिम्मतनगर टोल प्लाज़ा", [72.86883, 23.46442]),
  pump("vadodara-pump", "Vadodara pump", "वडोदरा पंप", [73.16894, 22.31306]),
  place("vadodara-plaza", "plaza", "Vadodara plaza", "वडोदरा टोल प्लाज़ा", [73.13711, 22.16455]),
  place("bharuch-plaza", "plaza", "Bharuch plaza", "भरूच टोल प्लाज़ा", [72.90149, 21.4068]),
  pump("surat-pump", "Surat pump", "सूरत पंप", [72.83606, 21.10072]),
  place("vapi-plaza", "plaza", "Vapi plaza", "वापी टोल प्लाज़ा", [72.89109, 20.47185]),
];

/**
 * Where RJ14 GB 4521 parked on trip 0926-04 (2:08–2:44 AM): 1.6 km off the
 * NH48 path near Behror, 3.1 km from the nearest pump (behror-pump).
 * Not a Place: the scenario's parked stop carries it as a bare lngLat.
 */
export const BEHROR_PARKING_0926_04: LngLat = [76.25938, 27.86735];

const BY_ID = new Map(PLACES.map((p) => [p.id, p]));

/** The place with this id; throws on an unknown id. */
export function placeById(id: string): Place {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown place id: ${id}`);
  return p;
}
