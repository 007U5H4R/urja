import { describe, expect, it } from "vitest";
import { DEMO_NOW } from "@/lib/clock";
import { haversineM } from "./geo";
import { placeById } from "./places";
import scenarioJson from "./scenario/scenario.json";
import { scenarioSchema } from "./scenario/schema";
import { sensorNoiseL, simulateTrip } from "./simulate";

const scenario = scenarioSchema.parse(scenarioJson);
const s0926_04 = scenario.trips.find((t) => t.id === "0926-04")!;
const trip = simulateTrip(s0926_04);

/** charts.js night0926(): fuel (L) at minutes after departure. */
const NIGHT0926: Record<number, number> = { 0: 210, 95: 194.2, 145: 194.2, 303: 168, 309: 168, 335: 130, 366: 128, 372: 266, 575: 230 };

describe("simulateTrip (TSK-02.4)", () => {
  it("emits one sample per minute from departure to arrival", () => {
    expect(trip.samples).toHaveLength(576);
    expect(trip.samples.every((s, i) => s.t === trip.start + i)).toBe(true);
  });

  it("reproduces night0926()'s fuel on 0926-04 within ±1.8 L", () => {
    for (const [t, litres] of Object.entries(NIGHT0926)) {
      expect(Math.abs(trip.samples[Number(t)].fuelCl / 100 - litres)).toBeLessThanOrEqual(1.8);
    }
  });

  it("integrates speed to the trip's 286 km (±2%), at about 36 km/h while moving", () => {
    const km = trip.samples.slice(0, -1).reduce((a, s) => a + s.speedKmh / 60, 0);
    expect(Math.abs(km - 286)).toBeLessThanOrEqual(286 * 0.02);
    const moving = trip.samples.filter((s) => s.speedKmh > 0);
    expect(moving.reduce((a, s) => a + s.speedKmh, 0) / moving.length).toBeCloseTo(36, 0);
  });

  it("parks 2:08–2:44 AM with the ignition off from 2:10", () => {
    const at = (m: number) => trip.samples[m];
    expect([at(303).speedKmh, at(338).speedKmh, at(339).speedKmh > 0]).toEqual([0, 0, true]);
    expect([at(304).ignition, at(305).ignition, at(338).ignition, at(339).ignition]).toEqual([true, false, false, true]);
  });

  it("puts FASTag events at the plazas", () => {
    for (const e of trip.fastag) {
      const s = trip.samples[e.t - trip.start];
      expect(haversineM(s.lngLat, placeById(e.placeId).lngLat)).toBeLessThan(1500);
    }
    expect(trip.fastag.map((e) => [e.t - trip.start, e.inr])).toEqual([[163, 705], [386, 725], [527, 710]]);
  });

  it("carries the bill and the settled tank readings", () => {
    expect(trip.refuels).toEqual([{ t: trip.start + 365, placeId: "neemrana-hp", billedCl: 14_000, billedInr: 12_600, tankRiseCl: 13_800 }]);
    expect(trip.tank).toEqual({ startCl: 21_000, endCl: 23_000 });
  });

  it("keeps every trip's fuel between 0 and 400 L, and its distance within 2%", () => {
    for (const s of scenario.trips) {
      const t = simulateTrip(s, { until: Math.min(s.end, DEMO_NOW) });
      expect(t.samples.every((x) => x.fuelCl >= 0 && x.fuelCl <= 40_000)).toBe(true);
      if (s.end <= DEMO_NOW) {
        const km = t.samples.slice(0, -1).reduce((a, x) => a + x.speedKmh / 60, 0);
        expect(Math.abs(km - t.actualKm)).toBeLessThanOrEqual(t.actualKm * 0.02);
      }
    }
  });

  it("replays a live trip only up to DEMO_NOW", () => {
    const live = scenario.trips.find((t) => t.start <= DEMO_NOW && t.end > DEMO_NOW)!;
    const t = simulateTrip(live, { until: DEMO_NOW });
    expect(t.samples[t.samples.length - 1].t).toBe(DEMO_NOW);
    expect(t.fastag.every((e) => e.t <= DEMO_NOW)).toBe(true);
  });

  it("keeps sensor noise within ±1.8 L, zero at both ends, and deterministic", () => {
    const n = sensorNoiseL("0926-04", 576);
    expect(Math.max(...n.map(Math.abs))).toBeLessThanOrEqual(1.8);
    expect([n[0], n[575]]).toEqual([0, 0]);
    expect(sensorNoiseL("0926-04", 576)).toEqual(n);
  });
});
