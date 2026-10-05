import { describe, expect, it } from "vitest";
import { mulberry32, SCENARIO_SEED } from "./prng";

describe("mulberry32", () => {
  it("yields a fixed sequence for seed 1 (snapshot of the first 5 values)", () => {
    const next = mulberry32(1);
    expect([next(), next(), next(), next(), next()]).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741,
      0.9683778982143849,
    ]);
  });

  it("is deterministic per seed and stays in [0, 1)", () => {
    const a = mulberry32(SCENARIO_SEED);
    const b = mulberry32(SCENARIO_SEED);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("uses the scenario seed from §4.7", () => {
    expect(SCENARIO_SEED).toBe(0x55524a41);
  });
});
