/**
 * Test helper: a synthetic, noise-free Trip for the rule boundary tests (TC-011).
 * Not used by the app.
 */
import { offsetM } from "../geo";
import { pointAtKm, routeById } from "../routes";
import type { LngLat, Min, RefuelBill, Sample, TollEvent, Trip } from "../types";

export interface SynthOptions {
  routeId?: string;
  plate?: string;
  minutes?: number;
  /** km/h during minute t (default 50). */
  speed?: (t: Min) => number;
  /** Litres at minute t (default 300 − 0.2 per minute). */
  fuelL?: (t: Min) => number;
  /** Where the truck is at minute t; default: along the route by distance. */
  at?: (t: Min, routeKm: number) => LngLat | null;
  refuels?: RefuelBill[];
  fastag?: TollEvent[];
  tollsClaimInr?: number;
  actualKm?: number;
  tank?: { startCl: number; endCl: number };
  loadT?: number;
}

export function synthTrip(o: SynthOptions = {}): Trip {
  const route = routeById(o.routeId ?? "JAI-OKH");
  const minutes = o.minutes ?? 360;
  const speed = o.speed ?? (() => 50);
  const fuelL = o.fuelL ?? ((t: Min) => 300 - 0.2 * t);
  const samples: Sample[] = [];
  let km = 0;
  for (let t = 0; t <= minutes; t++) {
    const v = t < minutes ? speed(t) : 0;
    const p = o.at?.(t, km) ?? pointAtKm(route, Math.min(km, route.plannedKm));
    samples.push({ t, lngLat: p, speedKmh: v, fuelCl: Math.round(fuelL(t) * 100), ignition: v > 0 });
    km += v / 60;
  }
  const fastag = o.fastag ?? [];
  return {
    id: "9999-01",
    plate: o.plate ?? "RJ14 GB 4521",
    routeId: route.id,
    start: 0,
    end: minutes,
    loadT: o.loadT ?? 20,
    cargo: { en: "Test", hi: "टेस्ट" },
    freightInr: 0,
    claims: { tollsInr: o.tollsClaimInr ?? fastag.reduce((a, e) => a + e.inr, 0), allowanceInr: 0, otherInr: 0 },
    samples,
    refuels: o.refuels ?? [],
    fastag,
    actualKm: o.actualKm ?? route.plannedKm,
    tank: o.tank ?? { startCl: samples[0].fuelCl, endCl: samples[samples.length - 1].fuelCl },
  };
}

/** A point `sideM` metres to the side of the route at `km`. */
export function besideRoute(routeId: string, km: number, sideM: number): LngLat {
  return offsetM(pointAtKm(routeById(routeId), km), sideM, 0);
}
