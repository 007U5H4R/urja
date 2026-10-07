import { describe, expect, it } from "vitest";
import { BOARD_COPY, BOARD_JOBS, BOARD_ROWS, BOARD_STATE_LABEL, DROPPED, type BoardCellState } from "./board";
import { isCited, sourceById, type Claim } from "./sources";
import { STREAMS } from "./streams";

// TASK-28 · the board (bet-spec §4, frozen): segments × jobs, the chosen cell, the phase cells,
// and the dropped candidates with their reasons.

function expectHonest(claim: Claim) {
  expect(claim.text.trim(), claim.text).not.toBe("");
  if (isCited(claim)) {
    expect(claim.sourceIds.length, claim.text).toBeGreaterThan(0);
    for (const id of claim.sourceIds) expect(() => sourceById(id), claim.text).not.toThrow();
  } else {
    expect(claim.assumption, claim.text).toBe(true);
    expect(claim.basis.trim(), claim.text).not.toBe("");
  }
}

const cellsIn = (state: BoardCellState) =>
  BOARD_ROWS.flatMap((r) => BOARD_JOBS.filter((j) => r.cells[j.id].state === state).map((j) => `${r.id}×${j.id}`));

describe("TASK-28 · the board", () => {
  it("has bet-spec's six jobs and five segments, in order, and every row fills every job", () => {
    expect(BOARD_JOBS.map((j) => j.label)).toEqual([
      "Leakage and books",
      "Uptime and maintenance",
      "Compliance",
      "Find loads",
      "Finance and insure the asset",
      "Driver safety",
    ]);
    expect(BOARD_ROWS.map((r) => r.label)).toEqual([
      "Small trucks (1–20)",
      "Mid/large trucks",
      "EV 2W/3W delivery",
      "Staff/school buses",
      "Intercity buses",
    ]);
    for (const r of BOARD_ROWS) expect(Object.keys(r.cells).sort()).toEqual(BOARD_JOBS.map((j) => j.id).sort());
  });

  it("lights exactly one chosen cell, small trucks × books, and marks phase 1b and phase 2 where the spec does", () => {
    expect(cellsIn("chosen")).toEqual(["small-trucks×books"]);
    expect(cellsIn("phase-1b")).toEqual(["small-trucks×finance"]);
    expect(cellsIn("phase-2")).toEqual(["ev-delivery×books", "ev-delivery×finance"]);
    expect(BOARD_ROWS.find((r) => r.id === "ev-delivery")?.note).toBe("Phase 2 segment");
  });

  it("names every marked state in words", () => {
    expect(BOARD_STATE_LABEL).toEqual({ chosen: "Chosen", "phase-1b": "Phase 1b", "phase-2": "Phase 2" });
    expect(BOARD_COPY.caption).toMatch(/Chosen/);
  });

  it("copies the spec's cell text, not new facts", () => {
    const small = BOARD_ROWS[0].cells;
    expect(small.books.text).toBe("Phase 1");
    expect(small.uptime.text).toBe("Intangles is strong, low WTP");
    expect(small.finance.text).toBe("Via the ledger");
    expect(BOARD_ROWS[2].cells.finance.text).toBe("Battery and earnings ledger");
    expect(BOARD_ROWS[1].cells.safety.text).toBe("Netradyne/Lytx");
  });

  it("says the bus rows are judgments, as an assumption with a basis", () => {
    expect(BOARD_COPY.claims.length).toBeGreaterThan(0);
    for (const c of BOARD_COPY.claims) expectHonest(c);
    const buses = BOARD_COPY.claims.find((c) => /bus/i.test(c.text))!;
    expect(isCited(buses)).toBe(false);
  });
});

describe("TASK-28 · the dropped candidates", () => {
  it("lists bet-spec's six, in order", () => {
    expect(DROPPED.map((d) => d.name)).toEqual([
      "Load matching",
      "Predictive maintenance",
      "Compliance on autopilot",
      "Video-AI safety",
      "Fuel card",
      "Insurance telematics now",
    ]);
  });

  it("gives every candidate a reason, and every claim is cited or a labelled assumption", () => {
    for (const d of DROPPED) {
      expect(d.claims.length, d.name).toBeGreaterThan(0);
      for (const c of d.claims) expectHonest(c);
    }
  });

  it("cites where the spec cites, with sources the research report has", () => {
    const ids = (name: string) => DROPPED.find((d) => d.name === name)!.claims.flatMap((c) => (isCited(c) ? c.sourceIds : []));
    expect(ids("Load matching")).toContain("vahak-network");
    // Both AIS-140 scopes, cited together, as the stream card does: the line implies neither one.
    const compliance = DROPPED.find((d) => d.name === "Compliance on autopilot")!.claims;
    const scope = compliance.find((c) => isCited(c) && c.sourceIds.includes("ais140-deadline"))!;
    expect(isCited(scope) && scope.sourceIds).toEqual(["ais140-rule-125h", "ais140-deadline"]);
    expect(scope).toBe(STREAMS["gps-ignition"].claims[0]);
    expect(scope.text).not.toMatch(/January 2025|31 March 2026/);
    const floor = compliance.find((c) => /commodity floor/.test(c.text))!;
    expect(isCited(floor)).toBe(false);
    expect(ids("Video-AI safety")).toContain("progressive-smart-haul");
    expect(ids("Fuel card")).toEqual(["motive-s1"]);
    expect(ids("Insurance telematics now")).toEqual(expect.arrayContaining(["irdai-payd-2022", "irdai-telematics"]));
    // Intangles' 500k+ comes from a press release with no captured URL, so the line is an assumption.
    expect(ids("Predictive maintenance")).toEqual([]);
  });

  it("a cited claim says no more than its snippet", () => {
    const all = DROPPED.flatMap((d) => d.claims);
    const text = (re: RegExp) => all.find((c) => re.test(c.text))!.text;
    expect(text(/Vahak/)).toBe("Vahak says more than 20 lakh transport businesses are registered on it.");
    expect(text(/Motive/)).toBe("Motive's S-1 says Spend Management contributed about 2%, 3% and 4% of its revenue.");
    expect(text(/Progressive/)).toBe("In the US, Progressive offers carriers that share ELD data discounts of 3–15%.");
  });
});
