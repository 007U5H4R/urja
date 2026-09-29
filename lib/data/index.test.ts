import { describe, expect, it } from "vitest";
import { ledgerFor, september, yesterday } from "./aggregates";
import { getDataset } from "./index";

// The dataset is shared by every caller in the process, so it is deep-frozen.
describe("getDataset() is read-only", () => {
  it("throws when a caller mutates a returned flag, ledger, trip or array", () => {
    const before = JSON.stringify(september());
    const flag = yesterday().flags[0] as { inr: number };
    expect(() => {
      flag.inr = 999_999;
    }).toThrow(TypeError);
    const ledger = ledgerFor("0926-04") as { profitInr: number };
    expect(() => {
      ledger.profitInr = 1;
    }).toThrow(TypeError);
    const ds = getDataset();
    expect(() => (ds.trips as unknown as unknown[]).push({})).toThrow(TypeError);
    expect(() => (ds.flags as unknown as unknown[]).sort()).toThrow(TypeError);
    expect(() => {
      (ds.trips[0].samples[0] as { fuelCl: number }).fuelCl = 0;
    }).toThrow(TypeError);
    expect(() => {
      (ds.scenario.now.trucks[0].lngLat as unknown as number[])[0] = 0;
    }).toThrow(TypeError);
    expect(JSON.stringify(september())).toBe(before);
  });
});
