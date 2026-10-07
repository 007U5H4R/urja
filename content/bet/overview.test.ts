import { describe, expect, it } from "vitest";
import { getFlagLabView } from "@/lib/bet/views/flag-lab";
import { BET_OVERVIEW } from "./copy";
import { AUTONOMY, LOOP, OVERVIEW_SECTIONS, TEASERS, TENX, overviewClaims } from "./overview";
import { citedSourceIds, isCited, sourceById, type Claim } from "./sources";

// TASK-28 · the /bet overview copy: the loop, the 5–10x, streams × autonomy, the teasers, and
// the page's claims in order.

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

describe("TASK-28 · overview copy", () => {
  it("keeps the h1 exactly 'Munshi → credit'", () => {
    expect(BET_OVERVIEW.h1).toBe("Munshi → credit");
  });

  it("orders the sections as the brief does, with unique ids", () => {
    expect(OVERVIEW_SECTIONS.map((s) => s.id)).toEqual([
      "loop",
      "tenx",
      "board",
      "shifts",
      "autonomy",
      "tiers",
      "lender",
      "roadmap",
      "metrics",
      "hypotheses",
    ]);
  });

  it("the loop runs close the books → verified truck-months → lending partnership → cheaper credit → the owner stays", () => {
    expect(LOOP.steps.map((s) => s.title)).toEqual([
      "Close the books daily",
      "Verified truck-months",
      "A consented lending partnership",
      "Cheaper credit",
      "The owner stays",
    ]);
    expect(LOOP.caption).toMatch(/^The loop/);
    expect(LOOP.steps[1].line).toContain("25 verified days");
  });

  it("the 5–10x has bet-spec §3's four dimensions and multiples", () => {
    expect(TENX.rows.map((r) => `${r.dimension}: ${r.multiple}`)).toEqual([
      "Time to know a leak: ~30x faster",
      "Hardware to measure fuel: Removes the main barrier for the long tail",
      "What the owner gets: Changes the job, not the speed",
      "Credit access: Lower-risk loans",
    ]);
  });

  it("the showcases walk the levels the flag lab computes for each trip", () => {
    for (const s of AUTONOMY.showcases) {
      const view = getFlagLabView(s.tripId)!;
      expect(view, s.tripId).not.toBeNull();
      // A typed bill is the claim under test, not a witness, so its step isn't on the path.
      const levels = view.flags[0].steps.filter((st) => st.counts).map((st) => st.level);
      const path = levels.filter((l, i) => i === 0 || l !== levels[i - 1]);
      expect(path, s.tripId).toEqual(s.path);
    }
    // 0926-04: the camera adds the 2nd family that L4 needs.
    const steps = getFlagLabView("0926-04")!.flags[0].steps;
    expect(steps.at(-1)?.streamId).toBe("camera");
    expect(steps.at(-1)?.families).toBe(2);
  });

  it("the ladder is L1–L5 with the tier each unlocks, and links to the real flag", () => {
    expect(AUTONOMY.ladder.map((l) => `${l.id} ${l.tier}`)).toEqual(["L1 Free", "L2 Munshi", "L3 Pro", "L4 Autopilot", "L5 No tier yet"]);
    expect(AUTONOMY.ladder[3].gate).toBe("High and at least 2 independent families");
    expect(AUTONOMY.link).toMatchObject({ href: "/trips/0926-04#flag-lab", label: "See it on a real flag" });
  });

  it("the teasers link to the tiers page and the lender view", () => {
    expect(TEASERS.tiers.link.href).toBe("/bet/tiers");
    expect(TEASERS.lender.link.href).toBe(`/trucks/${TEASERS.lender.slug}`);
    expect(TEASERS.lender.slug).toBe("rj14-gb-4521");
  });

  it("renders every BET_OVERVIEW claim, and every claim on the page is honest", () => {
    const claims = overviewClaims();
    for (const c of BET_OVERVIEW.claims) expect(claims).toContain(c);
    for (const c of claims) expectHonest(c);
    const ids = citedSourceIds(claims);
    expect(ids.length).toBeGreaterThan(20);
    for (const id of ids) expect(() => sourceById(id)).not.toThrow();
  });
});
