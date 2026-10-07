import { describe, expect, it } from "vitest";
import { BET_OVERVIEW } from "./copy";
import { HYPE, STRUCTURAL } from "./hype";
import { isCited, sourceById, type Claim } from "./sources";

// TASK-28 · structural shifts vs hype (research report §5–§7): a one-line mechanism per item,
// labelled as our reading; evidence cited no further than its snippet.

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

describe("TASK-28 · structural vs hype", () => {
  it("lists the brief's structural shifts: the rails, CAN data and embedded finance (plus WhatsApp distribution)", () => {
    expect(STRUCTURAL.map((s) => s.id)).toEqual(["rails", "telemetry", "embedded-finance", "whatsapp"]);
  });

  it("lists the brief's five hype items, in order", () => {
    expect(HYPE.map((h) => h.name)).toEqual([
      "“AI agents run the fleet”",
      "Driverless trucks as a 5-year plan",
      "Standalone vehicle-data marketplaces",
      "Fuel-card interchange",
      "Rapid heavy-truck electrification",
    ]);
  });

  it("every item has one mechanism line and at least one piece of evidence, all honest", () => {
    for (const item of [...STRUCTURAL, ...HYPE]) {
      expectHonest(item.mechanism);
      expect(item.mechanism.text.length, item.name).toBeLessThan(220);
      expect(item.evidence.length, item.name).toBeGreaterThan(0);
      for (const c of item.evidence) expectHonest(c);
    }
  });

  it("the mechanisms are our reading, so they are labelled assumptions", () => {
    for (const item of [...STRUCTURAL, ...HYPE]) expect(isCited(item.mechanism), item.name).toBe(false);
  });

  it("states every 'why now' claim of BET_OVERVIEW once, as the same object, except the segment size", () => {
    const evidence = STRUCTURAL.flatMap((s) => s.evidence);
    const folded = BET_OVERVIEW.claims.filter((c) => evidence.includes(c));
    expect(folded.length).toBe(BET_OVERVIEW.claims.length - 1);
    expect(BET_OVERVIEW.claims.find((c) => !evidence.includes(c))?.text).toMatch(/^About 75%/);
    expect(new Set(evidence).size).toBe(evidence.length);
  });

  it("cited evidence says no more than its snippet", () => {
    const all = [...STRUCTURAL, ...HYPE].flatMap((i) => i.evidence);
    const find = (re: RegExp) => all.find((c) => re.test(c.text))!;
    expect(find(/Aurora/).text).toBe("Aurora's Q2 2026 letter says it is fully allocated to exit the year with 200 driverless trucks in operation.");
    expect(find(/Wejo/).text).toMatch(/\$8\.4 million.*\$159\.3 million/);
    expect(find(/PM E-DRIVE/).text).toBe("PM E-DRIVE will support 5,643 e-trucks with a total allocation of ₹500 crore.");
    expect(find(/Samsara/).text).not.toMatch(/agent/i);
    expect(find(/Bombay High Court/).text).toMatch(/alleges/);
    expect(isCited(find(/12\.5 million/)) && find(/12\.5 million/)).toMatchObject({ sourceIds: ["zinka-prospectus"] });
  });
});
