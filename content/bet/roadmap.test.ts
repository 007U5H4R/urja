import { describe, expect, it } from "vitest";
import { NOT_BUILDING, ROADMAP, ROADMAP_COPY } from "./roadmap";
import { isCited } from "./sources";

// TASK-28 · the roadmap and the not-building list (bet-spec §10, frozen).

describe("TASK-28 · roadmap", () => {
  it("has three phases with bet-spec's windows", () => {
    expect(ROADMAP.map((p) => `${p.name} · ${p.window}`)).toEqual(["Phase 1 · 0–6 months", "Phase 2 · 6–12 months", "Phase 3 · 12–24 months"]);
    for (const p of ROADMAP) expect(p.items.length, p.name).toBeGreaterThan(0);
  });

  it("phase 1 starts with the daily close and L1–L2 on existing streams; phase 2 brings the lender and EVs", () => {
    expect(ROADMAP[0].items.join(" ")).toMatch(/daily close.*L1–L2.*Jaipur, Kishangarh and Delhi.*wrong-flag rate/);
    expect(ROADMAP[1].items.join(" ")).toMatch(/NBFC lending partnership.*EV 2W\/3W/);
    expect(ROADMAP[2].items.join(" ")).toMatch(/Insurance pricing.*Resale certificates.*Self-closing settlement/);
  });

  it("lists bet-spec's six things we are not building", () => {
    expect(NOT_BUILDING).toHaveLength(6);
    expect(NOT_BUILDING).toContain("A fuel card");
    expect(NOT_BUILDING).toContain("Driver scoring without the driver's side");
  });

  it("labels the plan as an assumption with a basis", () => {
    expect(isCited(ROADMAP_COPY.claim)).toBe(false);
    expect(ROADMAP_COPY.claim.basis).toMatch(/bet-spec §10/);
  });
});
