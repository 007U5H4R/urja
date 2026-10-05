import { describe, expect, it } from "vitest";
import { DIESEL_INR_PER_L, R1, WRONG_FLAG_LIMIT_PCT, R2, R3, R4, R5, r2Fires, r3Fires, r4OverKmFires } from "./constants";

describe("rule thresholds (TSK-02.1)", () => {
  it("values diesel at ₹90/L", () => {
    expect(DIESEL_INR_PER_L).toBe(90);
  });

  it("matches §17 TSK-02.1 exactly", () => {
    expect(R1).toEqual({ minDropL: 15, windowMin: 30, pumpGeofenceM: 300, minStopMin: 5 });
    expect(R2).toEqual({ overPct: 8 });
    expect(R3).toEqual({ overRatio: 1.12 });
    expect(R4).toEqual({ overPct: 6, detourKm: 10, offPathM: 500 });
    expect(R5).toEqual({ minDiffInr: 50 });
  });

  it("r3Fires: inclusive at +12% in integer maths", () => {
    expect(r3Fires(11200, 10000)).toBe(true);
    expect(r3Fires(11199, 10000)).toBe(false);
    expect(r3Fires(36400, 32500)).toBe(true); // flag 3: exactly +12.0%
    expect(r3Fires(8000, 8000)).toBe(false);
  });

  it("r2Fires: strictly more than +8% over the tank rise", () => {
    expect(r2Fires(10800, 10000)).toBe(false);
    expect(r2Fires(10801, 10000)).toBe(true);
    expect(r2Fires(25000, 20000)).toBe(true); // flag 2
    expect(r2Fires(14000, 13800)).toBe(false); // 0926-04's Neemrana bill matches
  });

  it("r4OverKmFires: strictly more than +6% over planned km", () => {
    expect(r4OverKmFires(106, 100)).toBe(false);
    expect(r4OverKmFires(106.01, 100)).toBe(true);
    expect(r4OverKmFires(303.16, 286)).toBe(false);
    expect(r4OverKmFires(303.2, 286)).toBe(true);
  });
});

describe("wrong-flag guardrail (D5)", () => {
  it("is 10% of flags", () => {
    expect(WRONG_FLAG_LIMIT_PCT).toBe(10);
  });
});
