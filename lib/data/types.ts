// Data model for the simulated fleet (technical-plan §4.1, verbatim).

export type Lang = 'hi' | 'en';
export type Plate = string;                 // 'RJ14 GB 4521'
export type TripId = string;                // 'MMDD-NN': start date (IST) + sequence that day, e.g. '0926-04'
export type Min = number;                   // minutes since EPOCH = 2026-08-29T00:00:00+05:30
export type LngLat = [number, number];
export type RuleId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
export type Confidence = 'high' | 'likely' | 'check';
export type FlagStatus = 'waiting' | 'confirmed' | 'wrong';

export interface Bilingual { en: string; hi: string }
export interface Place { id: string; name: Bilingual; lngLat: LngLat; kind: 'city' | 'yard' | 'pump' | 'plaza' | 'dhaba' | 'depot'; geofenceM?: number }
export interface Plaza { placeId: string; atKm: number; tariffInr: number }
export interface Route { id: string; from: string; to: string; plannedKm: number; path: LngLat[]; plazas: Plaza[]; pumps: string[]; stretches: string[] /* e.g. ['behror','udaipur'] */ }
export interface Driver { name: Bilingual; since: number }
export interface Truck { plate: Plate; driver: Driver; baselineCl: Record<string, number> /* routeId → centilitres per trip */; usualLoadT: Record<string, number> }
export interface Sample { t: Min; lngLat: LngLat; speedKmh: number; fuelCl: number; ignition: boolean }
export interface RefuelBill { t: Min; placeId: string; billedCl: number; billedInr: number; /** The sensor's settled tank rise for this refuel (see TankReadings). */ tankRiseCl: number }
/**
 * Settled tank readings (EXE6): the fuel sensor's level averaged while
 * the truck stands with the ignition on at departure and at arrival. They are
 * noise-free, so the ledger's diesel is exact (§4.5), while the rules still
 * detect from the noisy per-minute samples.
 */
export interface TankReadings { startCl: number; endCl: number }
export interface TollEvent { t: Min; placeId: string; inr: number }            // FASTag deduction
export interface Claims { tollsInr: number; allowanceInr: number; otherInr: number }
export interface Trip {
  id: TripId; plate: Plate; routeId: string; start: Min; end: Min; loadT: number; cargo: Bilingual;
  freightInr: number; claims: Claims; samples: Sample[]; refuels: RefuelBill[]; fastag: TollEvent[]; actualKm: number;
  tank: TankReadings;
}
export interface Evidence { text: Bilingual; source: 'Fuel sensor' | 'GPS · ignition' | 'Geofence' | 'Fleet history' | 'Fuel bill' | 'FASTag' | 'Trip plan' }
export interface Flag {
  id: string /* `${tripId}-${rule}` */; tripId: TripId; plate: Plate; rule: RuleId; at: Min; until?: Min; placeId?: string;
  litres?: number; inr: number; confidence: Confidence; evidence: Evidence[]; whyConfidence: Bilingual;
  status: FlagStatus; driverSide: { state: 'not-asked' | 'replied' | 'cleared' | 'confirmed'; text?: Bilingual };
  recoveredInr: number; dayKey: string /* IST date of trip end, 'YYYY-MM-DD' */;
}
export interface TripLedger { freightInr: number; dieselCl: number; dieselInr: number; unaccountedCl: number; unaccountedInr: number; tollsInr: number; allowanceInr: number; otherInr: number; profitInr: number }
