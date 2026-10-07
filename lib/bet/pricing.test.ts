import { afterEach, describe, expect, it, vi } from "vitest";
import { COST_INPUTS, EXAMPLE_LOAN, LENDING_CLAIMS, REFERRAL_FEE, WHATSAPP_DERIVATION } from "@/content/bet/costs";
import { isCited, sourceById, type Claim } from "@/content/bet/sources";
import { FUEL_SENSOR_TODAY, NO_NEW_HARDWARE, NO_NEW_HARDWARE_DESIGN, PRICE_ANCHORS, PRICING_CLAIMS, SPEND_LISTINGS, TIERS, tierById } from "@/content/bet/tiers";
import { FLEET } from "@/lib/data/fleet";
import { september } from "@/lib/data/aggregates";
import { costToServe, freeSubsidy, priceTier, recoveredPerTruck, wtpBand } from "./pricing";

// Lets a test swap fields of september() (the recovered total, the window), to prove the
// per-truck figure, its day count and its label are computed, not hard-coded.
type SeptemberFields = Partial<Pick<ReturnType<typeof september>, "recoveredInr" | "toDay" | "cumulativeL">>;
const override = vi.hoisted(() => ({ fields: null as SeptemberFields | null }));
vi.mock("@/lib/data/aggregates", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/data/aggregates")>();
  return {
    ...mod,
    september: () => {
      const s = mod.september();
      return override.fields === null ? s : { ...s, ...override.fields };
    },
  };
});

afterEach(() => {
  override.fields = null;
});

/** A claim is cited with ids that resolve, or an assumption with a non-empty basis. */
function expectHonest(claim: Claim) {
  expect(claim.text.trim()).not.toBe("");
  if (isCited(claim)) {
    expect(claim.sourceIds.length).toBeGreaterThan(0);
    for (const id of claim.sourceIds) expect(() => sourceById(id)).not.toThrow();
  } else {
    expect(claim.assumption).toBe(true);
    expect(claim.basis.trim()).not.toBe("");
  }
}

describe("TASK-24 · tiers (bet-spec §7)", () => {
  it("has the four tiers at the spec's prices, in ladder order", () => {
    expect(TIERS.map((t) => [t.id, t.name, t.priceInr])).toEqual([
      ["free", "Free", 0],
      ["munshi", "Munshi", 299],
      ["pro", "Pro", 499],
      ["autopilot", "Autopilot", 799],
    ]);
    expect(TIERS.map((t) => t.levels)).toEqual([["L1"], ["L1", "L2"], ["L1", "L2", "L3"], ["L1", "L2", "L3", "L4"]]);
    expect(TIERS.map((t) => t.levelsLabel)).toEqual([
      "L1",
      "L1–L2 and the daily close",
      "Adds L3 and benchmarks vs similar fleets",
      "Adds L4 guardrails",
    ]);
    expect(tierById("munshi").includesDailyClose).toBe(true);
    expect(tierById("free").includesDailyClose).toBe(false);
    for (const t of TIERS) expect(t.features.length).toBeGreaterThan(0);
  });

  it("says no new hardware: our design, labelled, then the rails that already exist, cited", () => {
    // TASK-27 fix round 1: the claim said more than its snippets; it now states the feeds, and the
    // no-new-hardware design is a separate, labelled assumption.
    expect(NO_NEW_HARDWARE.text).toMatch(/^The rails already exist: /);
    expectHonest(NO_NEW_HARDWARE);
    expect(isCited(NO_NEW_HARDWARE)).toBe(true);
    expectHonest(NO_NEW_HARDWARE_DESIGN);
    expect(isCited(NO_NEW_HARDWARE_DESIGN)).toBe(false);
    expect(NO_NEW_HARDWARE_DESIGN.text).toMatch(/^No new hardware: /);
    expect(PRICING_CLAIMS).toContain(NO_NEW_HARDWARE_DESIGN);
    expect(PRICING_CLAIMS).toContain(NO_NEW_HARDWARE);
  });

  it("anchors prices: ₹150–300 today (our estimate from cited listings), the ₹300–600 software entry tier (cited)", () => {
    expect([PRICE_ANCHORS.currentSpend.lowInr, PRICE_ANCHORS.currentSpend.highInr]).toEqual([150, 300]);
    expect([PRICE_ANCHORS.fleetxEntry.lowInr, PRICE_ANCHORS.fleetxEntry.highInr]).toEqual([300, 600]);
    const spend = PRICE_ANCHORS.currentSpend.claim;
    const fleetx = PRICE_ANCHORS.fleetxEntry.claim;
    // TASK-27: the band is derived from listed prices, so it is an assumption; the listings are cited.
    expectHonest(spend);
    expect(isCited(spend)).toBe(false);
    expect(isCited(SPEND_LISTINGS) && SPEND_LISTINGS.sourceIds).toEqual(["gps-loconav", "gps-wheelseye", "transportbook-pricing"]);
    expect(PRICING_CLAIMS).toContain(SPEND_LISTINGS);
    expect(isCited(fleetx) && fleetx.sourceIds).toEqual(["fleetx-pricing"]);
  });

  it("says what measuring fuel costs today, cited", () => {
    expect(isCited(FUEL_SENSOR_TODAY) && FUEL_SENSOR_TODAY.sourceIds).toEqual(["fuel-sensor-prices"]);
    expect(PRICING_CLAIMS).toContain(FUEL_SENSOR_TODAY);
  });

  it("labels each tier's price an assumption", () => {
    for (const t of TIERS) {
      expect(isCited(t.priceClaim)).toBe(false);
      expectHonest(t.priceClaim);
    }
  });
});

describe("TASK-24 · cost to serve", () => {
  it("lists the spec's five inputs, cited or labelled", () => {
    expect(COST_INPUTS.map((c) => [c.id, c.inrPerTruckMonth, isCited(c.claim)])).toEqual([
      ["whatsapp", 4, true],
      ["llm", 15, false],
      ["ingestion", 25, false],
      ["ocr", 4, false],
      ["support", 30, false],
    ]);
    for (const c of COST_INPUTS) expectHonest(c.claim);
  });

  it("cites only WhatsApp's unit price and labels the message volume an assumption", () => {
    const w = COST_INPUTS[0];
    expect(isCited(w.claim) && w.claim.sourceIds).toEqual(["whatsapp-pricing"]);
    expect(w.volume).toBeDefined();
    expectHonest(w.volume!);
    expect(isCited(w.volume!)).toBe(false);
    expect(COST_INPUTS.slice(1).every((c) => c.volume === undefined)).toBe(true);
  });

  it("derives the WhatsApp line from ~30 messages × ₹0.145", () => {
    expect(WHATSAPP_DERIVATION).toEqual({ messages: 30, unitInr: 0.145 });
    expect(Math.round(WHATSAPP_DERIVATION.messages * WHATSAPP_DERIVATION.unitInr)).toBe(COST_INPUTS[0].inrPerTruckMonth);
  });

  it("is the sum of the inputs: ₹78", () => {
    expect(costToServe()).toBe(COST_INPUTS.reduce((s, c) => s + c.inrPerTruckMonth, 0));
    expect(costToServe()).toBe(78);
  });

  it("labels the lending inputs assumptions: a ₹10 lakh loan, a 0.5–1.5% fee", () => {
    expect(EXAMPLE_LOAN.amountInr).toBe(1_000_000);
    expect([REFERRAL_FEE.lowPct, REFERRAL_FEE.highPct]).toEqual([0.5, 1.5]);
    for (const c of [EXAMPLE_LOAN.claim, REFERRAL_FEE.claim]) {
      expect(isCited(c)).toBe(false);
      expectHonest(c);
    }
  });
});

describe("TASK-24 · the referral role", () => {
  it("is our reading of the Directions, labelled an assumption (TASK-27)", () => {
    expectHonest(LENDING_CLAIMS.role);
    expect(isCited(LENDING_CLAIMS.role)).toBe(false);
  });
});

describe("TASK-24 · the consent basis", () => {
  it("cites the consent facts and labels the consent design an assumption", () => {
    for (const c of LENDING_CLAIMS.consent) expectHonest(c);
    const cited = LENDING_CLAIMS.consent.slice(0, -1);
    expect(cited.map((c) => isCited(c) && c.sourceIds)).toEqual([
      ["aa-consents-sahamati", "aa-fy25"],
      ["rbi-digital-lending"],
      ["dpdp-rules-2025"],
      ["aa-consent-manager"],
    ]);
    const design = LENDING_CLAIMS.consent[LENDING_CLAIMS.consent.length - 1];
    expect(isCited(design)).toBe(false);
    expect(!isCited(design) && design.assumption).toBe(true);
    for (const id of ["dpdp-rules-2025", "aa-consent-manager", "aa-consents-sahamati"]) {
      expect(sourceById(id).status).toBe("unverified");
    }
  });
});

describe("TASK-24 · willingness to pay and recovered ₹", () => {
  it("gives the research band ₹150–300", () => {
    const band = wtpBand();
    expect([band.lowInr, band.highInr]).toEqual([150, 300]);
    expect(band.claim).toBe(PRICE_ANCHORS.currentSpend.claim);
  });

  it("computes recovered ₹ per truck per month from september(): ÷ 24 trucks, scaled to 30 days", () => {
    const s = september();
    const days = 27; // 1–27 Sep
    const r = recoveredPerTruck();
    expect(r.septemberRecoveredInr).toBe(s.recoveredInr);
    expect(r.trucks).toBe(FLEET.length);
    expect(r.days).toBe(days);
    expect(r.perTruckMonthInr).toBe(Math.round(((s.recoveredInr / FLEET.length) * 30) / days));
    expect(r.perTruckMonthInr).toBe(1000); // ₹21,600 ÷ 24 = ₹900 in 27 days → ₹1,000 in 30
    expect(r.label).toMatch(/simulated/i);
    expect(r.label).toBe(
      "Recovered per truck per month on the simulated fleet: ₹21,600 recovered 1–27 Sep ÷ 24 trucks, scaled to 30 days.",
    );
    expect(wtpBand().recovered).toEqual(r);
  });

  it("takes the day count from september()'s window: one running total per day, 1–27 Sep inclusive", () => {
    const s = september();
    expect([s.fromDay, s.toDay]).toEqual(["2026-09-01", "2026-09-27"]);
    expect(s.cumulativeL.length).toBe(27);
    expect(recoveredPerTruck().days).toBe(s.cumulativeL.length);
  });

  it("is not hard-coded: it follows september()'s recovered total", () => {
    override.fields = { recoveredInr: 43_200 };
    expect(recoveredPerTruck().perTruckMonthInr).toBe(2000);
  });

  it("is not hard-coded: its day count and label follow september()'s window", () => {
    override.fields = { recoveredInr: 24_000, toDay: "2026-09-20", cumulativeL: Array.from({ length: 20 }, () => 0) };
    const r = recoveredPerTruck();
    expect(r.days).toBe(20);
    expect(r.perTruckMonthInr).toBe(1500); // ₹24,000 ÷ 24 = ₹1,000 in 20 days → ₹1,500 in 30
    expect(r.label).toContain("₹24,000 recovered 1–20 Sep");
  });
});

describe("TASK-24 · priceTier", () => {
  it("prices every paid tier above cost to serve, with its margin", () => {
    expect(TIERS.filter((t) => t.priceInr > 0).map((t) => [t.id, priceTier(t).marginInr, priceTier(t).marginPct])).toEqual([
      ["munshi", 221, 74],
      ["pro", 421, 84],
      ["autopilot", 721, 90],
    ]);
    for (const t of TIERS.filter((t) => t.priceInr > 0)) {
      const p = priceTier(t);
      expect(p.priceInr).toBeGreaterThan(p.costInr);
      expect(p.costInr).toBe(costToServe());
      expect(p.subsidisedBy).toBeNull();
    }
  });

  it("runs Free below cost, subsidised by the lending partner", () => {
    const p = priceTier(tierById("free"));
    expect(p.priceInr).toBe(0);
    expect(p.marginInr).toBe(-78);
    expect(p.marginPct).toBeNull();
    expect(p.subsidisedBy).toBe("lending-partner");
    expect(tierById("free").subsidisedBy).toBe("lending-partner");
  });

  it("places each price against the ₹150–300 band, Fleetx's entry tier and recovered ₹", () => {
    expect(TIERS.map((t) => [t.id, priceTier(t).vsWtp, priceTier(t).vsFleetx, priceTier(t).shareOfRecoveredPct])).toEqual([
      ["free", "free", "free", 0],
      ["munshi", "within", "below", 30],
      ["pro", "above", "within", 50],
      ["autopilot", "above", "above", 80],
    ]);
  });

  it("gives a 0% share of recovered ₹ when nothing was recovered, never NaN or Infinity", () => {
    override.fields = { recoveredInr: 0 };
    expect(recoveredPerTruck().perTruckMonthInr).toBe(0);
    expect(TIERS.map((t) => priceTier(t).shareOfRecoveredPct)).toEqual([0, 0, 0, 0]);
  });
});

describe("TASK-24 · freeSubsidy", () => {
  it("shows one referral fee on a ₹10 lakh loan covering 5–16 years of one truck's Free cost", () => {
    expect(freeSubsidy()).toEqual({
      loanInr: 1_000_000,
      feeLowInr: 5_000,
      feeHighInr: 15_000,
      freeCostPerYearInr: 936,
      yearsLow: 5,
      yearsHigh: 16,
    });
  });
});

describe("TASK-24 · honesty and determinism", () => {
  it("cites or labels every pricing claim", () => {
    expect(PRICING_CLAIMS.length).toBeGreaterThan(0);
    for (const c of PRICING_CLAIMS) expectHonest(c);
  });

  it("returns the same figures on every call", () => {
    const run = () => ({
      cost: costToServe(),
      wtp: wtpBand(),
      tiers: TIERS.map(priceTier),
      subsidy: freeSubsidy(),
    });
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});
