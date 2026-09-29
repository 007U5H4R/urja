import { describe, expect, it } from "vitest";
import { detectR3 } from "./r3-excess";
import { synthTrip } from "./test-trip";

// Anil (RJ14 GC 3309) on JAI-BHW: baseline 325 L, usual load 22 t.
function used(cl: number, loadT = 22) {
  return synthTrip({ routeId: "JAI-BHW", plate: "RJ14 GC 3309", minutes: 1400, loadT, tank: { startCl: 40_000, endCl: 40_000 - cl } });
}

describe("R3 · excess consumption (TC-011, TP3)", () => {
  it("does not fire at 11.9% over the baseline", () => {
    expect(detectR3(used(36_367))).toEqual([]);
  });

  it("does not fire 1 cL short of 12.0% (36,399 cL)", () => {
    expect(detectR3(used(36_399))).toEqual([]);
  });

  it("fires at exactly 12.0% over (364 L vs 325 L): 39 L", () => {
    const [f] = detectR3(used(36_400));
    expect([f.rule, f.litres, f.inr]).toEqual(["R3", 39, 3510]);
  });

  it("caps confidence at Check when the load is heavier than usual", () => {
    const [f] = detectR3(used(36_400, 26));
    expect(f.confidence).toBe("check");
    expect(f.evidence.map((e) => e.text.en)).toContain("Load 26 t (usual 22 t)");
    expect(f.evidence.map((e) => e.text.en)).toContain("Spread across the trip, no single stop");
  });

  it("does not count litres R1 already flagged", () => {
    expect(detectR3(used(36_400), { r1Cl: 3_800, r4Cl: 0 })).toEqual([]);
  });
});
