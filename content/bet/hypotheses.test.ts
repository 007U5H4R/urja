import { describe, expect, it } from "vitest";
import { BET_TRUCK } from "./copy";
import { HYPOTHESES, UNTESTED, hypothesisClaims } from "./hypotheses";
import { isCited, sourceById, type Claim } from "./sources";
import { PRICE_ANCHORS } from "./tiers";

// TASK-28 · H1–H7 (bet-spec §5): all untested by field calls, each with the research for and against.

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

describe("TASK-28 · hypotheses", () => {
  it("has H1–H7 with bet-spec's statements", () => {
    expect(HYPOTHESES.map((h) => h.id)).toEqual(["H1", "H2", "H3", "H4", "H5", "H6", "H7"]);
    expect(HYPOTHESES[0].statement).toBe("Leakage is material for small fleets");
    expect(HYPOTHESES[6].statement).toBe("Insurers would price on telemetry (India)");
  });

  it("labels every one untested: no field calls", () => {
    expect(UNTESTED).toBe("Untested: no field calls");
    for (const h of HYPOTHESES) expect(h.status, h.id).toBe(UNTESTED);
  });

  it("gives each a one-line verdict in bet-spec's wording", () => {
    const v = Object.fromEntries(HYPOTHESES.map((h) => [h.id, h.verdict]));
    expect(v.H1).toBe("Supported, but the number is soft (~8% oft-cited; vendor 10–37%).");
    expect(v.H4).toMatch(/lending partnership\.$/);
    expect(v.H5).toBe("Weak: CAN steps are 10–40 L. Hence stream fusion and honest confidence.");
    expect(v.H7).toBe("Weak now. Phase 3.");
    for (const h of HYPOTHESES) {
      expect(h.verdict.length, h.id).toBeLessThan(160);
      expect(h.verdictShort.length, h.id).toBeLessThan(28);
    }
  });

  it("H3 names the ₹150–300 as our estimate, and cites the listings beside it", () => {
    const h3 = HYPOTHESES.find((h) => h.id === "H3")!;
    expect(h3.verdict).toContain("we estimate they pay ₹150–300");
    expect(h3.against).toContain(PRICE_ANCHORS.currentSpend.claim);
  });

  it("carries research for and against, or says the research found nothing", () => {
    for (const h of HYPOTHESES) {
      if (h.noEvidence) {
        expectHonest(h.noEvidence);
        expect(h.for.length + h.against.length, h.id).toBe(0);
      } else {
        expect(h.for.length, h.id).toBeGreaterThan(0);
        expect(h.against.length, h.id).toBeGreaterThan(0);
      }
    }
    for (const c of hypothesisClaims()) expectHonest(c);
  });

  it("reuses the lender page's credit claims as the same objects", () => {
    const h4 = HYPOTHESES.find((h) => h.id === "H4")!;
    for (const c of h4.for) expect(BET_TRUCK.claims as readonly Claim[]).toContain(c);
  });
});
