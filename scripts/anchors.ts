/**
 * Every anchor in technical-plan §4.3 (and HANDOFF "Fixed numbers"), as data.
 * scripts/generate-scenario.ts builds the scenario around these and refuses
 * to write it unless the pipeline reproduces every one of them exactly.
 * Never edit a value here to make a check pass.
 */
import { istMin } from "@/lib/clock";
import type { Bilingual, RuleId } from "@/lib/data/types";

const sep = (d: number, h = 0, m = 0) => istMin(2026, 9, d, h, m);

// ── Fleet table ──────────────────────────────────────────────────────────
export interface VisibleTruck {
  rank: number;
  plate: string;
  septKm: number;
  perKm: number;
  /** Σ ₹ of the truck's September flags that are not "wrong". */
  unaccountedInr: number;
  now: { state: "moving" | "yard"; label: Bilingual };
}

export const VISIBLE_TRUCKS: VisibleTruck[] = [
  { rank: 1, plate: "RJ14 GC 7710", septKm: 6840, perKm: 31.8, unaccountedInr: 0, now: { state: "moving", label: { en: "To Ahmedabad", hi: "अहमदाबाद की ओर" } } },
  { rank: 2, plate: "RJ14 GA 2204", septKm: 6210, perKm: 29.6, unaccountedInr: 0, now: { state: "yard", label: { en: "Jaipur yard", hi: "जयपुर यार्ड" } } },
  { rank: 3, plate: "RJ14 GB 1450", septKm: 7120, perKm: 28.1, unaccountedInr: 900, now: { state: "moving", label: { en: "To Delhi", hi: "दिल्ली की ओर" } } },
  { rank: 4, plate: "RJ14 GC 0931", septKm: 5480, perKm: 26.7, unaccountedInr: 0, now: { state: "yard", label: { en: "Okhla, Delhi", hi: "ओखला, दिल्ली" } } },
  { rank: 5, plate: "RJ14 GA 6618", septKm: 6950, perKm: 25.2, unaccountedInr: 1480, now: { state: "moving", label: { en: "To Mumbai", hi: "मुंबई की ओर" } } },
  { rank: 22, plate: "RJ14 GA 1182", septKm: 6300, perKm: 16.4, unaccountedInr: 8100, now: { state: "yard", label: { en: "Jaipur yard", hi: "जयपुर यार्ड" } } },
  { rank: 23, plate: "RJ14 GB 4521", septKm: 6480, perKm: 15.1, unaccountedInr: 9630, now: { state: "yard", label: { en: "Okhla, Delhi", hi: "ओखला, दिल्ली" } } },
  { rank: 24, plate: "RJ14 GC 3309", septKm: 7410, perKm: 12.7, unaccountedInr: 11250, now: { state: "yard", label: { en: "Bhiwandi", hi: "भिवंडी" } } },
];

/** Ranks 6–21: ₹/km exact; Sept km 5,600–7,300; strictly inside (16.4, 25.2). */
export const HIDDEN_TRUCKS: { rank: number; plate: string; perKm: number }[] = [
  { rank: 6, plate: "RJ14 GB 3087", perKm: 25.0 },
  { rank: 7, plate: "RJ14 GA 7345", perKm: 24.3 },
  { rank: 8, plate: "RJ14 GC 1268", perKm: 23.8 },
  { rank: 9, plate: "RJ14 GB 5590", perKm: 23.1 },
  { rank: 10, plate: "RJ14 GA 4411", perKm: 22.6 },
  { rank: 11, plate: "RJ14 GC 8826", perKm: 22.0 },
  { rank: 12, plate: "RJ14 GB 2903", perKm: 21.4 },
  { rank: 13, plate: "RJ14 GA 9152", perKm: 20.9 },
  { rank: 14, plate: "RJ14 GC 4470", perKm: 20.3 },
  { rank: 15, plate: "RJ14 GB 6134", perKm: 19.8 },
  { rank: 16, plate: "RJ14 GA 3378", perKm: 19.2 },
  { rank: 17, plate: "RJ14 GC 5021", perKm: 18.7 },
  { rank: 18, plate: "RJ14 GB 7716", perKm: 18.1 },
  { rank: 19, plate: "RJ14 GA 5023", perKm: 17.6 },
  { rank: 20, plate: "RJ14 GC 2689", perKm: 17.2 },
  { rank: 21, plate: "RJ14 GB 8352", perKm: 16.9 },
];
export const HIDDEN_KM_RANGE: [number, number] = [5600, 7300];
export const HIDDEN_PER_KM_OPEN: [number, number] = [16.4, 25.2];

export const PLATE = {
  mahesh: "RJ14 GC 7710",
  suresh: "RJ14 GA 2204",
  imran: "RJ14 GB 1450",
  balwant: "RJ14 GC 0931",
  deepak: "RJ14 GA 6618",
  sunil: "RJ14 GB 7716",
  rajendra: "RJ14 GA 5023",
  vikram: "RJ14 GA 1182",
  ramesh: "RJ14 GB 4521",
  anil: "RJ14 GC 3309",
} as const;

export const NOW_COUNTS = { moving: 11, yard: 12, workshop: 1 } as const;

// ── Yesterday (Sun 27 Sep) ───────────────────────────────────────────────
export const YESTERDAY = {
  dayKey: "2026-09-27",
  trips: 17,
  freightInr: 412_000,
  dieselInr: 158_300,
  tollsInr: 38_900,
  allowanceOtherInr: 28_400,
  profitInr: 186_400,
  unaccountedInr: 11_430,
  unaccountedL: 127,
  udaipurTrips: 6,
  barPct: { diesel: 38.4, tolls: 9.4, other: 6.9, profit: 45.3 },
} as const;

// ── Flags ────────────────────────────────────────────────────────────────
export interface DieselIncident {
  n: string;
  day: number;
  tripId: string;
  plate: string;
  rule: Extract<RuleId, "R1" | "R2" | "R3">;
  litres: number;
  inr: number;
  behror: boolean;
  status: "confirmed" | "waiting";
  recoveredInr: number;
  driverSide: { state: "not-asked" | "replied" | "cleared" | "confirmed"; text?: Bilingual };
}

export const DIESEL_INCIDENTS: DieselIncident[] = [
  { n: "D1", day: 5, tripId: "0905-03", plate: PLATE.vikram, rule: "R1", litres: 40, inr: 3600, behror: true, status: "confirmed", recoveredInr: 3600, driverSide: { state: "confirmed", text: { en: "Confirmed after a call.", hi: "फ़ोन पर बात के बाद माना।" } } },
  { n: "D2", day: 9, tripId: "0909-03", plate: PLATE.anil, rule: "R3", litres: 38, inr: 3420, behror: false, status: "confirmed", recoveredInr: 0, driverSide: { state: "replied", text: { en: "Heavy load, slow ghats.", hi: "भारी लोड, घाट पर धीमे चले।" } } },
  { n: "D3", day: 12, tripId: "0912-05", plate: PLATE.ramesh, rule: "R1", litres: 69, inr: 6210, behror: true, status: "confirmed", recoveredInr: 6210, driverSide: { state: "confirmed" } },
  { n: "D4", day: 17, tripId: "0917-06", plate: PLATE.anil, rule: "R3", litres: 48, inr: 4320, behror: false, status: "confirmed", recoveredInr: 0, driverSide: { state: "replied", text: { en: "Noted.", hi: "नोट किया।" } } },
  { n: "D5", day: 21, tripId: "0921-09", plate: PLATE.sunil, rule: "R1", litres: 42, inr: 3780, behror: true, status: "confirmed", recoveredInr: 3780, driverSide: { state: "confirmed" } },
  { n: "D6", day: 23, tripId: "0923-02", plate: PLATE.rajendra, rule: "R1", litres: 48, inr: 4320, behror: true, status: "confirmed", recoveredInr: 1800, driverSide: { state: "confirmed", text: { en: "₹1,800 deducted so far.", hi: "अब तक ₹1,800 काटे गए।" } } },
  { n: "D7", day: 27, tripId: "0926-04", plate: PLATE.ramesh, rule: "R1", litres: 38, inr: 3420, behror: true, status: "waiting", recoveredInr: 0, driverSide: { state: "not-asked" } },
  { n: "D8", day: 27, tripId: "0927-02", plate: PLATE.vikram, rule: "R2", litres: 50, inr: 4500, behror: false, status: "waiting", recoveredInr: 0, driverSide: { state: "replied", text: { en: "The nozzle stopped early; I told the attendant.", hi: "नोज़ल जल्दी रुक गया था; मैंने अटेंडेंट को बताया था।" } } },
  { n: "D9", day: 27, tripId: "0926-11", plate: PLATE.anil, rule: "R3", litres: 39, inr: 3510, behror: false, status: "waiting", recoveredInr: 0, driverSide: { state: "not-asked" } },
];

export interface NonDieselFlag {
  n: string;
  day: number;
  rule: "R4" | "R5";
  /** A fixed plate, or null for "a rank 6–21 truck" (the generator assigns it). */
  plate: string | null;
  inr: number;
  status: "confirmed" | "wrong";
  recoveredInr: number;
  driverSide: { state: "replied" | "cleared" | "confirmed"; text?: Bilingual };
}

const confirmed = { state: "confirmed" as const };
export const NON_DIESEL_FLAGS: NonDieselFlag[] = [
  { n: "N1", day: 1, rule: "R5", plate: null, inr: 1220, status: "confirmed", recoveredInr: 1220, driverSide: confirmed },
  { n: "N2", day: 2, rule: "R4", plate: PLATE.deepak, inr: 1480, status: "confirmed", recoveredInr: 1480, driverSide: confirmed },
  { n: "N3", day: 4, rule: "R5", plate: null, inr: 760, status: "confirmed", recoveredInr: 0, driverSide: confirmed },
  { n: "N4", day: 6, rule: "R4", plate: null, inr: 1340, status: "confirmed", recoveredInr: 0, driverSide: confirmed },
  { n: "N5", day: 7, rule: "R5", plate: null, inr: 1080, status: "confirmed", recoveredInr: 0, driverSide: confirmed },
  { n: "N6", day: 8, rule: "R5", plate: null, inr: 630, status: "confirmed", recoveredInr: 630, driverSide: confirmed },
  { n: "N7", day: 11, rule: "R5", plate: null, inr: 1450, status: "wrong", recoveredInr: 0, driverSide: { state: "cleared", text: { en: "The FASTag didn't read at the plaza; I paid cash and have the receipt.", hi: "प्लाज़ा पर FASTag नहीं पढ़ा गया; मैंने नकद दिया और रसीद दिखाई।" } } },
  { n: "N8", day: 13, rule: "R4", plate: null, inr: 1260, status: "confirmed", recoveredInr: 1260, driverSide: confirmed },
  { n: "N9", day: 14, rule: "R5", plate: null, inr: 1230, status: "confirmed", recoveredInr: 0, driverSide: confirmed },
  { n: "N10", day: 15, rule: "R5", plate: PLATE.imran, inr: 900, status: "confirmed", recoveredInr: 900, driverSide: confirmed },
  { n: "N11", day: 16, rule: "R4", plate: null, inr: 1150, status: "confirmed", recoveredInr: 0, driverSide: confirmed },
  { n: "N12", day: 18, rule: "R5", plate: null, inr: 720, status: "confirmed", recoveredInr: 720, driverSide: confirmed },
  { n: "N13", day: 20, rule: "R4", plate: null, inr: 1160, status: "confirmed", recoveredInr: 0, driverSide: confirmed },
  { n: "N14", day: 22, rule: "R4", plate: null, inr: 6780, status: "wrong", recoveredInr: 0, driverSide: { state: "cleared", text: { en: "The highway was closed after an accident; police diverted us.", hi: "हादसे के बाद हाईवे बंद था; पुलिस ने दूसरे रास्ते भेजा।" } } },
];

/** Plates that must carry no September flag (Imran and Deepak only N10 and N2). */
export const NO_FLAG_PLATES = [PLATE.mahesh, PLATE.suresh, PLATE.balwant];

export const SEPTEMBER = {
  trips: 212,
  flags: 23,
  confirmed: 18,
  waiting: 3,
  wrong: 2,
  flaggedInr: 58_240,
  recoveredInr: 21_600,
  dieselL: 412,
  dieselInr: 37_080,
  incidentDays: [5, 9, 12, 17, 21, 23, 27],
  behror: { flags: 5, litres: 237, tripIds: ["0905-03", "0912-05", "0921-09", "0923-02", "0926-04"] },
} as const;

export const CUMULATIVE_L = [0, 0, 0, 0, 40, 40, 40, 40, 78, 78, 78, 147, 147, 147, 147, 147, 195, 195, 195, 195, 237, 237, 285, 285, 285, 285, 412];

export const WEEKS = [
  { days: [1, 7], flaggedInr: 9_480, recoveredInr: 6_300 },
  { days: [8, 14], flaggedInr: 14_200, recoveredInr: 8_100 },
  { days: [15, 21], flaggedInr: 12_030, recoveredInr: 5_400 },
  { days: [22, 27], flaggedInr: 22_530, recoveredInr: 1_800 },
] as const;

export const LAST7 = { litres: 217, inr: 19_530, tripIds: ["0926-04", "0927-02", "0926-11", "0923-02", "0921-09"] } as const;
export const ANIL = { litres: 125, inr: 11_250, tripIds: ["0926-11", "0917-06", "0909-03"] } as const;

// ── Days ─────────────────────────────────────────────────────────────────
/** Daily profit for trips that ended 14–27 Sep (exact). */
export const DAILY_PROFIT: Record<number, number> = {
  14: 142_000, 15: 161_000, 16: 98_000, 17: 177_000, 18: 155_000, 19: 130_000, 20: 188_000,
  21: 149_000, 22: 166_000, 23: 121_000, 24: 194_800, 25: 158_000, 26: 172_000, 27: 186_400,
};
export const CLEAN_DAY_24 = { day: 24, trips: 17, profitInr: 194_800 } as const;
/** Days in 1–24 Sep with no flags. */
export const CLEAN_DAYS_TO_24 = [3, 10, 19, 24];

// ── Route normal of 0926-04 ──────────────────────────────────────────────
/** Profits of the 13 previous clean Jaipur → Okhla trips (ending 13–26 Sep), oldest first. */
export const ROUTE_NORMAL_PROFITS = [16_200, 17_100, 16_900, 15_800, 17_400, 16_500, 16_100, 17_000, 16_800, 16_300, 17_200, 16_600, 16_680];
export const ROUTE_NORMAL_INR = 16_660;

// ── Trip anchors ─────────────────────────────────────────────────────────
export const T0926_04 = {
  id: "0926-04",
  plate: PLATE.ramesh,
  routeId: "JAI-OKH",
  start: sep(26, 21, 5),
  end: sep(27, 6, 40),
  loadT: 24,
  cargo: { en: "cement", hi: "सीमेंट" },
  freightInr: 28_000,
  allowanceInr: 1_200,
  otherInr: 800,
  dieselCl: 11_800,
  profitInr: 13_240,
  tollsInr: 2_140,
  startFuelL: 210,
  endFuelL: 230,
  /** Minutes after t₀ (charts.js night0926 and trip.html). */
  dhaba: [95, 145],
  parked: [303, 339],
  drop: { from: 309, to: 335, litres: 38 },
  refuel: { stop: [360, 373], billAt: 365, billedL: 140, riseL: 138, placeId: "neemrana-hp" },
  plazas: [
    { placeId: "manoharpur-plaza", at: 163, inr: 705 },
    { placeId: "shahjahanpur-plaza", at: 386, inr: 725 },
    { placeId: "kherki-daula-plaza", at: 527, inr: 710 },
  ],
  /** night0926() fuel at t, litres (TSK-02.4). */
  fuelAt: { 0: 210, 95: 194.2, 145: 194.2, 303: 168, 309: 168, 335: 130, 366: 128, 372: 266, 575: 230 } as Record<number, number>,
  /** Burn per moving leg (L): 0–95, 145–303, 339–360, 373–575. */
  legFuelL: [15.8, 26.2, 2, 36],
  evidence: [
    "Fuel fell 168 → 130 L in 26 minutes",
    "Parked with ignition off, 2:08–2:44 AM",
    "1.6 km off NH48; nearest pump is 3.1 km away",
    "Same stretch flagged 4 more times this month",
  ],
  at: sep(27, 2, 14),
  until: sep(27, 2, 40),
} as const;

export const T0927_02 = {
  id: "0927-02",
  plate: PLATE.vikram,
  routeId: "AHM-JAI",
  start: sep(27, 3, 50),
  end: sep(27, 19, 0),
  refuel: { placeId: "kishangarh-pump", billAt: sep(27, 16, 50), billedL: 250, riseL: 200 },
} as const;

export const T0926_11 = {
  id: "0926-11",
  plate: PLATE.anil,
  routeId: "JAI-BHW",
  start: sep(26, 4, 30),
  end: sep(27, 8, 10),
  loadT: 26,
  usedL: 364,
  baselineL: 325,
  stops: [[240, 280], [540, 580], [1140, 1410]] as [number, number][],
} as const;

export const T0917_06 = { id: "0917-06", plate: PLATE.anil, routeId: "JAI-BHW", start: sep(17, 0, 20), end: sep(17, 23, 50), stopMin: 45 } as const;

export const LIVE_TRIPS = 11;
