/**
 * TC-013 · the one plausibility bound the scenario and simulator tests do not
 * already cover: every finished trip's freight per km sits within its route's
 * band. (∫speed ≈ km, fuel within 0–400 L, no overlaps, and the balancer's
 * toll / other / local-km ranges are in simulate.test.ts and scenario.test.ts.)
 */
import { describe, expect, it } from "vitest";
import { basePerKm, FREIGHT_BAND } from "@/scripts/scenario/balance";
import { getDataset } from "./index";

describe("TC-013 · freight per km", () => {
  it("keeps every finished trip's freight per km within its route's band", () => {
    const out = getDataset().trips.filter((t) => {
      const perKm = t.freightInr / t.actualKm;
      const base = basePerKm(t.routeId);
      return perKm < base * FREIGHT_BAND[0] || perKm > base * FREIGHT_BAND[1];
    });
    expect(out.map((t) => t.id)).toEqual([]);
  });
});
