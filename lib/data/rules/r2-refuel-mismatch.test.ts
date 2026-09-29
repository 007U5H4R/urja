import { describe, expect, it } from "vitest";
import { sensorNoiseL } from "../simulate";
import { detectR2 } from "./r2-refuel-mismatch";
import { synthTrip } from "./test-trip";

/** A refuel billed at t=100 at the Neemrana pump; the tank rises 100 L over t 101–107. */
function refuel(billedL: number) {
  const stop = (t: number) => t >= 94 && t < 112;
  return synthTrip({
    speed: (t) => (stop(t) ? 0 : 50),
    fuelL: (t) => 150 + 100 * Math.min(1, Math.max(0, (t - 101) / 6)),
    refuels: [{ t: 100, placeId: "neemrana-hp", billedCl: Math.round(billedL * 100), billedInr: Math.round(billedL * 90), tankRiseCl: 10_000 }],
  });
}

describe("R2 · refuel mismatch (TC-011)", () => {
  it("does not fire when the bill is 8.0% above the rise", () => {
    expect(detectR2(refuel(108))).toEqual([]);
  });

  it("fires when the bill is 8.1% above the rise (a thin margin: Check)", () => {
    const [f] = detectR2(refuel(108.1));
    expect([f.rule, f.litres, f.inr, f.placeId, f.at, f.confidence]).toEqual(["R2", 8, 720, "neemrana-hp", 100, "check"]);
  });

  it("measures 50 L on a 250 L bill for a 200 L rise, capped at Likely", () => {
    const big = synthTrip({
      speed: (t) => (t >= 94 && t < 112 ? 0 : 50),
      fuelL: (t) => 130 + 200 * Math.min(1, Math.max(0, (t - 101) / 6)),
      refuels: [{ t: 100, placeId: "kishangarh-pump", billedCl: 25_000, billedInr: 22_500, tankRiseCl: 20_000 }],
    });
    const [f] = detectR2(big);
    expect([f.litres, f.inr, f.confidence]).toEqual([50, 4500, "likely"]);
    expect(f.evidence[0].text.en).toBe("Bill says 250 L (₹22,500); the tank rose 200 L");
  });

  it("reads through the sensor's noise: 250 L billed for a 200 L rise is still 50 L", () => {
    const noise = sensorNoiseL("9999-03", 361);
    const trip = synthTrip({
      speed: (t) => (t >= 94 && t < 112 ? 0 : 50),
      fuelL: (t) => 130 + 200 * Math.min(1, Math.max(0, (t - 101) / 6)) + noise[t],
      refuels: [{ t: 100, placeId: "kishangarh-pump", billedCl: 25_000, billedInr: 22_500, tankRiseCl: 20_000 }],
    });
    expect(detectR2(trip).map((f) => f.litres)).toEqual([50]);
  });

  it("skips a bill in the trip's last 10 minutes (no reading after it)", () => {
    const trip = synthTrip({
      minutes: 360,
      speed: (t) => (t >= 350 ? 0 : 50),
      fuelL: (t) => 100 + 100 * Math.min(1, Math.max(0, (t - 356) / 3)),
      refuels: [{ t: 355, placeId: "kishangarh-pump", billedCl: 25_000, billedInr: 22_500, tankRiseCl: 10_000 }],
    });
    expect(detectR2(trip)).toEqual([]);
  });
});
