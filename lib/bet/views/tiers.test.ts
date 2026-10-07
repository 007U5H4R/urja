import { describe, expect, it } from "vitest";
import { BET_TIERS } from "@/content/bet/copy";
import { COST_INPUTS, EXAMPLE_LOAN } from "@/content/bet/costs";
import { citedSourceIds, isCited, sourceById } from "@/content/bet/sources";
import {
  FUEL_SENSOR_TODAY,
  NO_NEW_HARDWARE,
  NO_NEW_HARDWARE_DESIGN,
  PRICE_ANCHORS,
  PRICING_CLAIMS,
  SPEND_LISTINGS,
  TIER_TABLE,
  TIERS,
} from "@/content/bet/tiers";
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

  it("places each price against our spend estimate, with its margin", () => {
    // TASK-27 round 2: the ₹150–300 band is our estimate, so it is never called "today's spend".
    expect(view.rows.map((r) => [r.vsWtp, r.marginPct])).toEqual([
      ["Free to the owner", ""],
      ["Within our ₹150–300 spend estimate", "74%"],
      ["Above our ₹150–300 spend estimate: priced on actions", "84%"],
      ["Above our ₹150–300 spend estimate: priced on actions", "90%"],
    ]);
    expect(JSON.stringify(view)).not.toMatch(/today's spend/i);
  });

  it("pre-formats the fleet-software comparison and the share of recovered ₹", () => {
    expect(view.rows.map((r) => [r.vsFleetx, r.shareOfRecoveredText])).toEqual([
      ["Free to the owner", ""],
      ["Below the ₹300–600 fleet-software entry tier", "30% of recovered ₹"],
      ["Within the ₹300–600 fleet-software entry tier", "50% of recovered ₹"],
      ["Above the ₹300–600 fleet-software entry tier", "80% of recovered ₹"],
    ]);
  });

  it("carries each tier's price claim and its honesty status", () => {
    view.rows.forEach((r, i) => {
      expect(r.priceClaim).toBe(TIERS[i].priceClaim);
      expect(r.priceStatus).toBe("Assumption");
    });
  });

  it("charts each tier's price from the pricing functions (priceChart replaced the unused chart field)", () => {
    expect("chart" in view).toBe(false);
    expect(view.priceChart.tiers.map((t) => t.priceInr)).toEqual(TIERS.map((t) => priceTier(t).priceInr));
  });

  it("says who pays for each tier, in words", () => {
    expect(view.rows.map((r) => r.paidByText)).toEqual([
      "Lending partners, through referral fees",
      "The owner",
      "The owner",
      "The owner",
    ]);
  });

  it("names the autonomy level each tier unlocks, from the ladder", () => {
    expect(view.rows.map((r) => r.autonomy)).toEqual([
      "L1 · Insight",
      "L2 · Deterministic action",
      "L3 · Corrective SOP",
      "L4 · Guardrail",
    ]);
  });

  it("gives the price chart its scale, bands, marks, labels and a summary, all from the pricing functions", () => {
    const c = view.priceChart;
    expect(c.label).toMatch(/price per truck per month/i);
    expect(c.maxInr).toBe(1250);
    expect(c.ticks.map((t) => [t.inr, t.label])).toEqual([
      [0, "₹0"],
      [250, "₹250"],
      [500, "₹500"],
      [750, "₹750"],
      [1000, "₹1,000"],
      [1250, "₹1,250"],
    ]);
    expect(c.marks.map((m) => [m.id, m.inr, m.label])).toEqual([
      ["cost", costToServe(), "Cost to serve ₹78"],
      ["recovered", 1000, "Recovered ₹1,000"],
    ]);
    expect(c.bands.map((b) => [b.id, b.lowInr, b.highInr, b.label])).toEqual([
      ["wtp", 150, 300, "Our spend estimate ₹150–300"],
      ["fleetx", 300, 600, "Software entry tier ₹300–600"],
    ]);
    expect(c.tiers.map((t) => [t.tierId, t.priceInr, t.price])).toEqual([
      ["free", 0, "₹0"],
      ["munshi", 299, "₹299"],
      ["pro", 499, "₹499"],
      ["autopilot", 799, "₹799"],
    ]);
    expect(c.summary).toBe(
      "Every paid tier is priced above the ₹78 cost to serve and below the ₹1,000 recovered per truck a month on the simulated fleet. Munshi (₹299) sits within our ₹150–300 spend estimate; Pro (₹499) and Autopilot (₹799) sit above it. Free (₹0) runs below cost, paid for by referral fees.",
    );
    // Everything plotted fits the scale.
    for (const v of [...c.tiers.map((t) => t.priceInr), ...c.marks.map((m) => m.inr), ...c.bands.map((b) => b.highInr)]) {
      expect(v).toBeLessThanOrEqual(c.maxInr);
    }
  });

  it("carries the no-new-hardware design (labelled), the rails it reads (cited) and what measuring fuel costs today", () => {
    expect(view.hardware).toEqual({ design: NO_NEW_HARDWARE_DESIGN, line: NO_NEW_HARDWARE, today: FUEL_SENSOR_TODAY });
    expect(isCited(view.hardware.design)).toBe(false);
  });

  it("lists its claims in reading order, each once, covering every claim the page renders", () => {
    expect(view.claims.slice(0, 6)).toEqual([
      NO_NEW_HARDWARE_DESIGN,
      NO_NEW_HARDWARE,
      FUEL_SENSOR_TODAY,
      PRICE_ANCHORS.currentSpend.claim,
      SPEND_LISTINGS,
      PRICE_ANCHORS.fleetxEntry.claim,
    ]);
    expect(view.claims[view.claims.length - 1]).toBe(EXAMPLE_LOAN.claim);
    expect(new Set(view.claims).size).toBe(view.claims.length);
    for (const c of [...PRICING_CLAIMS, ...COST_INPUTS.flatMap((x) => (x.volume ? [x.claim, x.volume] : [x.claim])), EXAMPLE_LOAN.claim]) {
      expect(view.claims, c.text).toContain(c);
    }
    // So the page's [n] run 1, 2, 3… down the page: the tier table cites first.
    expect(view.sourceIds.slice(0, 5)).toEqual(["ais140-rule-125h", "tata-fleet-edge", "fastag-98", "eway-bills", "fuel-sensor-prices"]);
  });

  it("gives the tier table its caption and row labels, and marks the simulated row", () => {
    expect(view.table.simulatedRow).toBe("shareOfRecovered");
    expect(view.table).toBe(TIER_TABLE);
    expect(Object.values(view.table.rowLabels)).toEqual([
      "Price",
      "What it adds",
      "Autonomy it unlocks",
      "Cost to serve",
      "Margin",
      "Share of recovered ₹",
      "Against our spend estimate",
      "Against the software entry tier",
      "Who pays",
      "Price basis",
    ]);
  });

  it("keeps the repeated price bases short in Who pays", () => {
    for (const c of view.whoPays[0].claims) expect(!isCited(c) && c.basis.length, c.text).toBeLessThanOrEqual(130);
    const free = view.whoPays[1].claims[0];
    expect(!isCited(free) && free.basis.length).toBeLessThanOrEqual(90);
  });

  it("carries the price anchors for the price logic: the spend estimate, its listings, and the software entry tier", () => {
    expect(view.anchors).toEqual([PRICE_ANCHORS.currentSpend.claim, SPEND_LISTINGS, PRICE_ANCHORS.fleetxEntry.claim]);
  });

  it("works the Free subsidy in three steps: loan → fee → years of Free", () => {
    expect(view.subsidySteps).toEqual([
      { label: "One used-truck loan", value: "₹10 lakh" },
      { label: "Referral fee at 0.5–1.5%", value: "₹5,000–15,000" },
      { label: "Years of Free on that truck, at ₹936 a year", value: "5–16 years" },
    ]);
    expect(view.subsidyClaims).toEqual([EXAMPLE_LOAN.claim]);
  });

  it("lists the cost inputs with a status and a ₹78 total", () => {
    // The first claim of each line is cited (WhatsApp's unit price) or an assumption (the rest).
    expect(view.costs.rows.map((r) => [r.id, r.amount, isCited(r.claims[0]) ? "Cited" : "Assumption"])).toEqual([
      ["whatsapp", "₹4", "Cited"],
      ["llm", "₹15", "Assumption"],
      ["ingestion", "₹25", "Assumption"],
      ["ocr", "₹4", "Assumption"],
      ["support", "₹30", "Assumption"],
    ]);
    // The unused per-row claim and status fields are gone: claims carries both.
    for (const r of view.costs.rows) {
      expect("claim" in r).toBe(false);
      expect("status" in r).toBe(false);
    }
    expect(view.costs.total).toBe("₹78");
    // WhatsApp: the cited unit price, then the labelled message volume.
    const w = view.costs.rows[0];
    expect(w.claims).toEqual([COST_INPUTS[0].claim, COST_INPUTS[0].volume]);
    view.costs.rows.slice(1).forEach((r, i) => expect(r.claims).toEqual([COST_INPUTS[i + 1].claim]));
  });

  it("states recovered ₹ per truck and the Free subsidy as strings", () => {
    expect(view.recovered.value).toBe("₹1,000");
    expect(view.recovered.label).toMatch(/simulated/i);
    expect(view.subsidy).toBe(
      "One ₹10 lakh used-truck loan pays ₹5,000–15,000 in referral fees, which covers 5–16 years of Free on that truck (₹936 a year).",
    );
  });

  it("writes every rupee range one way: ₹low–high", () => {
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
    // Each tier's price claim sits with its payer: the paid tiers with the owner, Free with the lending partner.
    expect(view.whoPays[0].claims).toEqual(TIERS.filter((t) => t.paidBy === "owner").map((t) => t.priceClaim));
    expect(view.whoPays[1].claims[0]).toBe(TIERS[0].priceClaim);
    const consent = view.whoPays[2];
    expect(consent.pays).toMatch(/Account Aggregator/);
    expect(consent.pays).toMatch(/DPDP/);
    expect(consent.pays).toMatch(/Digital Lending Directions, 2025/);
    expect(consent.claims.some((c) => isCited(c) && c.sourceIds.includes("rbi-digital-lending"))).toBe(true);
    // The consent flow is our design, not a fact: the row says so, and carries the labelled assumption.
    expect(consent.pays).toMatch(/^Assumption: /);
    expect(consent.pays).toBe(
      "Assumption: the owner consents before any data is shared, recorded under the DPDP Act and carried by an Account Aggregator where one can carry the data, under the RBI's Digital Lending Directions, 2025",
    );
    expect(consent.claims.some((c) => !isCited(c) && /consents/.test(c.text))).toBe(true);
  });

  it("carries the no-new-hardware line", () => {
    expect(view.hardware.design.text).toMatch(/^No new hardware/);
    // The unread fields are gone.
    expect("noNewHardware" in view).toBe(false);
    expect("wtp" in view).toBe(false);
  });

  it("cites or labels every claim, and its source list resolves", () => {
    for (const c of view.claims) {
      if (isCited(c)) for (const id of c.sourceIds) expect(() => sourceById(id)).not.toThrow();
      else expect(c.basis.trim()).not.toBe("");
    }
    for (const id of view.sourceIds) expect(() => sourceById(id)).not.toThrow();
    expect(view.sourceIds).toContain("whatsapp-pricing");
    expect(view.sourceIds).toContain("fleetx-pricing");
    // Everything the page renders is in view.claims, so <Sources> covers every [n].
    const all = [
      ...view.anchors,
      ...view.rows.map((r) => r.priceClaim),
      view.hardware.design,
      view.hardware.line,
      view.hardware.today,
      ...view.costs.rows.flatMap((r) => r.claims),
      ...view.whoPays.flatMap((r) => r.claims),
      ...view.subsidyClaims,
      ...BET_TIERS.claims,
    ];
    for (const c of all) expect(view.claims, c.text).toContain(c);
    expect(view.sourceIds).toEqual(citedSourceIds(view.claims));
    for (const id of ["gps-loconav", "gps-wheelseye", "transportbook-pricing", "fuel-sensor-prices", "rbi-digital-lending"]) {
      expect(view.sourceIds).toContain(id);
    }
  });

  it("is deterministic", () => {
    expect(JSON.stringify(getTiersView())).toBe(JSON.stringify(view));
  });
});
