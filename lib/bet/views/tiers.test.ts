import { describe, expect, it } from "vitest";
import { isCited, sourceById } from "@/content/bet/sources";
import { TIERS } from "@/content/bet/tiers";
import { costToServe, priceTier } from "../pricing";
import { getTiersView } from "./tiers";

describe("TASK-24 · getTiersView", () => {
  const view = getTiersView();

  it("has one pre-formatted row per tier", () => {
    expect(view.rows.map((r) => [r.id, r.name, r.price, r.cost, r.margin])).toEqual([
      ["free", "Free", "₹0", "₹78", "−₹78"],
      ["munshi", "Munshi", "₹299", "₹78", "₹221"],
      ["pro", "Pro", "₹499", "₹78", "₹421"],
      ["autopilot", "Autopilot", "₹799", "₹78", "₹721"],
    ]);
    expect(view.rows.map((r) => r.paidBy)).toEqual(["lending-partner", "owner", "owner", "owner"]);
    for (const r of view.rows) {
      expect(r.unit).toBe("per truck per month");
      expect(r.levels).not.toBe("");
      expect(r.features.length).toBeGreaterThan(0);
      expect(r.vsWtp).not.toBe("");
    }
    expect(view.rows[1].levels).toBe("L1–L2 and the daily close");
    expect(view.rows[2].levels).toBe("Adds L3 and benchmarks vs similar fleets");
  });

  it("places each price against today's spend, with its margin", () => {
    expect(view.rows.map((r) => [r.vsWtp, r.marginPct])).toEqual([
      ["Free to the owner", ""],
      ["Within today's ₹150–300 spend", "74%"],
      ["Above today's ₹150–300 spend: priced on actions", "84%"],
      ["Above today's ₹150–300 spend: priced on actions", "90%"],
    ]);
  });

  it("pre-formats the Fleetx comparison and the share of recovered ₹", () => {
    expect(view.rows.map((r) => [r.vsFleetx, r.shareOfRecoveredText])).toEqual([
      ["Free to the owner", ""],
      ["Below Fleetx's ₹300–600 entry tier", "30% of recovered ₹"],
      ["Within Fleetx's ₹300–600 entry tier", "50% of recovered ₹"],
      ["Above Fleetx's ₹300–600 entry tier", "80% of recovered ₹"],
    ]);
  });

  it("carries each tier's price claim and its honesty status", () => {
    view.rows.forEach((r, i) => {
      expect(r.priceClaim).toBe(TIERS[i].priceClaim);
      expect(r.priceStatus).toBe("Assumption");
    });
  });

  it("charts cost, price and the WTP band per tier, from the pricing functions", () => {
    expect(view.chart).toEqual(
      TIERS.map((t) => ({
        tierId: t.id,
        name: t.name,
        costInr: costToServe(),
        priceInr: priceTier(t).priceInr,
        wtpLowInr: 150,
        wtpHighInr: 300,
      })),
    );
  });

  it("lists the cost inputs with a status and a ₹78 total", () => {
    expect(view.costs.rows.map((r) => [r.id, r.amount, r.status])).toEqual([
      ["whatsapp", "₹4", "Cited"],
      ["llm", "₹15", "Assumption"],
      ["ingestion", "₹25", "Assumption"],
      ["ocr", "₹4", "Assumption"],
      ["support", "₹30", "Assumption"],
    ]);
    expect(view.costs.total).toBe("₹78");
  });

  it("states recovered ₹ per truck and the Free subsidy as strings", () => {
    expect(view.recovered.value).toBe("₹1,000");
    expect(view.recovered.label).toMatch(/simulated/i);
    expect(view.subsidy).toBe(
      "One ₹10 lakh used-truck loan pays ₹5,000–15,000 in referral fees, which covers 5–16 years of Free on that truck (₹936 a year).",
    );
  });

  it("writes every rupee range one way: ₹low–high", () => {
    expect(view.wtp).toBe("₹150–300 per truck per month");
    expect(view.whoPays[0].pays).toBe("Munshi, Pro and Autopilot: ₹299–799 per truck per month");
    const strings = JSON.stringify(view);
    expect(strings).not.toMatch(/–₹/);
    expect(strings).not.toMatch(/₹10,00,000/);
  });

  it("says who pays: the owner, the lending partner, and the consent basis", () => {
    expect(view.whoPays.map((r) => r.payer)).toEqual(["Owner", "Lending partner", "Consent basis"]);
    expect(view.whoPays[0].pays).toContain("Munshi, Pro and Autopilot");
    expect(view.whoPays[1].pays).toMatch(/referral fee/i);
    expect(view.whoPays[1].funds).toBe("Free");
    const consent = view.whoPays[2];
    expect(consent.pays).toMatch(/Account Aggregator/);
    expect(consent.pays).toMatch(/DPDP/);
    expect(consent.pays).toMatch(/Digital Lending Directions, 2025/);
    expect(consent.claims.some((c) => isCited(c) && c.sourceIds.includes("rbi-digital-lending"))).toBe(true);
    // The consent flow is our design, not a fact: the row says so, and carries the labelled assumption.
    expect(consent.pays).toMatch(/^Assumption: /);
    expect(consent.claims.some((c) => !isCited(c) && /consents/.test(c.text))).toBe(true);
  });

  it("carries the no-new-hardware line", () => {
    expect(view.noNewHardware).toMatch(/^No new hardware/);
  });

  it("cites or labels every claim, and its source list resolves", () => {
    for (const c of view.claims) {
      if (isCited(c)) for (const id of c.sourceIds) expect(() => sourceById(id)).not.toThrow();
      else expect(c.basis.trim()).not.toBe("");
    }
    for (const id of view.sourceIds) expect(() => sourceById(id)).not.toThrow();
    expect(view.sourceIds).toContain("whatsapp-pricing");
    expect(view.sourceIds).toContain("fleetx-pricing");
  });

  it("is deterministic", () => {
    expect(JSON.stringify(getTiersView())).toBe(JSON.stringify(view));
  });
});
