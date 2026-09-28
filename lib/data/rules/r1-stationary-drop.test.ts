import { describe, expect, it } from "vitest";
import { BEHROR_PARKING_0926_04, placeById } from "../places";
import type { LngLat, Min } from "../types";
import { sensorNoiseL } from "../simulate";
import { detectR1 } from "./r1-stationary-drop";
import { synthTrip } from "./test-trip";

const STOP: [Min, Min] = [120, 170];

/** Moving at `stopSpeed` inside the stop window; `drop` litres fall over t 130–150. */
function parkedDrop(drop: number, where: LngLat = BEHROR_PARKING_0926_04, stopSpeed = 0, noise?: number[]) {
  const inStop = (t: Min) => t >= STOP[0] && t < STOP[1];
  const burnt = (t: Min) => 0.2 * (Math.min(t, STOP[0]) + Math.max(0, t - STOP[1]));
  return synthTrip({
    speed: (t) => (inStop(t) ? stopSpeed : 50),
    fuelL: (t) => 300 - burnt(t) - drop * Math.min(1, Math.max(0, (t - 130) / 20)) + (noise?.[t] ?? 0),
    at: (t) => (inStop(t) ? where : null),
  });
}

describe("R1 · stationary fuel drop (TC-011)", () => {
  it("does not fire on a 15.0 L drop", () => {
    expect(detectR1(parkedDrop(15.0))).toEqual([]);
  });

  it("fires on a 15.1 L drop", () => {
    const [f] = detectR1(parkedDrop(15.1));
    expect(f.rule).toBe("R1");
    expect(f.litres).toBe(15);
    expect(f.inr).toBe(1350);
  });

  it("does not fire inside a pump geofence", () => {
    expect(detectR1(parkedDrop(40, placeById("behror-pump").lngLat))).toEqual([]);
  });

  it("does not fire while moving at 5 km/h", () => {
    expect(detectR1(parkedDrop(40, BEHROR_PARKING_0926_04, 5))).toEqual([]);
  });

  it("dates the drop from its onset to the last minute it is falling", () => {
    const [f] = detectR1(parkedDrop(40));
    expect([f.at, f.until, f.litres, f.placeId]).toEqual([130, 150, 40, "behror"]);
    expect(f.evidence.map((e) => e.source)).toEqual(["Fuel sensor", "GPS · ignition", "Geofence", "Fleet history"]);
    expect(f.evidence[2].text.en).toBe("1.6 km off NH48; nearest pump is 3.1 km away");
    expect(f.evidence[3].text.en).toBe("First flag on this stretch this month");
  });

  it("counts the same stretch's other flags this month", () => {
    const trip = parkedDrop(40);
    const other = { ...detectR1(trip)[0], tripId: "0905-03" };
    const [f] = detectR1(trip, { fleetFlags: [other, { ...other, tripId: "0912-05" }] });
    expect(f.evidence[3].text.en).toBe("Same stretch flagged 2 more times this month");
  });

  it("reads through the sensor's noise: a 40 L drop still reads 40 L and ±2 L", () => {
    const noise = sensorNoiseL("9999-01", 361);
    const [f] = detectR1(parkedDrop(40, BEHROR_PARKING_0926_04, 0, noise));
    expect(f.litres).toBe(40);
    // A slosh spike on the drop's first minute (this seed has one at t 130) can move the onset by a minute.
    expect(Math.abs(f.at - 130)).toBeLessThanOrEqual(1);
    expect(Math.abs(f.until! - 150)).toBeLessThanOrEqual(1);
    expect(f.whyConfidence.en).toContain("±2 L");
    expect(f.confidence).toBe("high");
  });

  it("does not fire on sensor noise alone", () => {
    expect(detectR1(parkedDrop(0, BEHROR_PARKING_0926_04, 0, sensorNoiseL("9999-02", 361)))).toEqual([]);
  });
});
