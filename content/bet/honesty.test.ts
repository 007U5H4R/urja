import { describe, expect, it } from "vitest";
import { getTiersView } from "@/lib/bet/views/tiers";
import { BET_OVERVIEW, BET_TIERS, BET_TRUCK } from "./copy";
import { COST_INPUTS, LENDING_CLAIMS } from "./costs";
import { isCited, sourceById, type Claim } from "./sources";
import { GUARDRAIL_MIN_FAMILIES } from "./ladder";
import { FUEL_SENSOR_TODAY, NO_NEW_HARDWARE, NO_NEW_HARDWARE_DESIGN, PRICE_ANCHORS, SPEND_LISTINGS, tierById } from "./tiers";

// TASK-27 · the honesty pass: a cited claim says no more than its source's snippet
// (docs/bet/research-report.md §13); anything we infer or chose is a labelled assumption.

/** Cited with ids that resolve, or an assumption with a basis. */
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

function claimIn(claims: readonly Claim[], re: RegExp): Claim {
  const hit = claims.find((c) => re.test(c.text));
  if (!hit) throw new Error(`No claim matches ${re}`);
  return hit;
}

const truckClaims = BET_TRUCK.claims as readonly Claim[];
const whatsapp = COST_INPUTS.find((c) => c.id === "whatsapp")!;

describe("TASK-27 · claims say no more than their snippets", () => {
  it("e-way bills: a record of about 140 million in March 2026, not a monthly rate", () => {
    const c = claimIn(BET_OVERVIEW.claims, /e-way bills/i);
    expect(c.text).toBe("E-way bills hit a record of about 140 million in March 2026.");
    expect(isCited(c) && c.sourceIds).toEqual(["eway-bills"]);
    expect(BET_OVERVIEW.claims.some((x) => /every month/.test(x.text))).toBe(false);
  });

  it("the referral role is our reading, labelled; the cited RBI fact only says the Directions replaced the 2022 guidelines", () => {
    const role = LENDING_CLAIMS.role;
    expect(isCited(role)).toBe(false);
    expect(!isCited(role) && role.basis).toMatch(/8 May 2025/);
    expect(BET_TIERS.claims).toContain(role);
    const fact = claimIn(LENDING_CLAIMS.consent, /Digital Lending Directions/);
    expect(isCited(fact) && fact.sourceIds).toEqual(["rbi-digital-lending"]);
    expect(fact.text).toMatch(/replaced the 2022/);
    // No cited claim anywhere in the bet copy calls it a regulated role.
    const everyCited = [...BET_OVERVIEW.claims, ...BET_TIERS.claims, ...truckClaims, ...getTiersView().claims].filter(isCited);
    expect(everyCited.filter((c) => /regulated role|regulate/i.test(c.text)).map((c) => c.text)).toEqual([]);
  });

  it("BlackBuck: the cited fact stands alone; the lending-partnership inference is our labelled design choice", () => {
    const fact = claimIn(truckClaims, /BlackBuck/);
    expect(isCited(fact) && fact.sourceIds).toEqual(["blackbuck-lending"]);
    expect(fact.text).not.toMatch(/partnership|so the|rather than/i);
    const design = claimIn(truckClaims, /consented lending partnership/);
    expect(isCited(design)).toBe(false);
    expect(!isCited(design) && design.basis).toMatch(/design choice/i);
  });

  it("the ₹150–300 spend is our estimate, labelled, with a basis naming the listings; the listings themselves are cited", () => {
    const spend = PRICE_ANCHORS.currentSpend.claim;
    expect(isCited(spend)).toBe(false);
    const basis = !isCited(spend) ? spend.basis : "";
    for (const name of ["LocoNav", "WheelsEye", "TransportBook"]) expect(basis).toContain(name);
    expect(basis).toContain("a LocoNav tracker, a WheelsEye tracker with a year's plan");
    expect(isCited(SPEND_LISTINGS) && SPEND_LISTINGS.sourceIds).toEqual(["gps-loconav", "gps-wheelseye", "transportbook-pricing"]);
  });

  it("fleet software's entry tier is the industry figure the snippet gives, not Fleetx's own price", () => {
    const c = PRICE_ANCHORS.fleetxEntry.claim;
    expect(c.text).toBe("Fleet software's entry tier typically costs ₹300–600 per vehicle a month.");
    expect(isCited(c) && c.sourceIds).toEqual(["fleetx-pricing"]);
    const view = getTiersView();
    expect(JSON.stringify(view.rows.map((r) => r.vsFleetx))).not.toMatch(/Fleetx/);
  });

  it("WhatsApp: only the unit price is cited; the ~30 messages a month are a labelled assumption", () => {
    expect(whatsapp.claim.text).toBe("A WhatsApp utility message costs ₹0.145 per message delivered.");
    expect(isCited(whatsapp.claim) && whatsapp.claim.sourceIds).toEqual(["whatsapp-pricing"]);
    expect(whatsapp.claim.text).not.toMatch(/30/);
    const volume = whatsapp.volume!;
    expect(volume.text).toMatch(/30/);
    expect(isCited(volume)).toBe(false);
  });

  it("the consent row says an Account Aggregator carries the data only where one can", () => {
    const consent = getTiersView().whoPays.find((r) => r.payer === "Consent basis")!;
    expect(consent.pays).toContain("carried by an Account Aggregator where one can carry the data");
  });

  it("the other cited claims match their snippets' scope", () => {
    expect(claimIn(BET_OVERVIEW.claims, /telemetry/).text).toMatch(/^Many trucks already send telemetry/);
    expect(claimIn(BET_OVERVIEW.claims, /98%/).text).toMatch(/collected electronically, through FASTag/);
    expect(claimIn(BET_OVERVIEW.claims, /lakh crore/).text).toMatch(/disbursed via Account Aggregators in FY25/);
    expect(FUEL_SENSOR_TODAY.text).toMatch(/^Fuel-level sensors are listed at/);
  });

  it("Stage 3: the cited claim gives only the two snippet figures; the 3.3–4.8% range is our labelled reading", () => {
    const cited = claimIn(truckClaims, /^Cholamandalam/);
    expect(cited.text).toBe("Cholamandalam reports Stage 3 (90+ days overdue) at 3.35% (Sep 2025), and Mahindra Finance at 3.7% (Mar 2025).");
    expect(isCited(cited) && cited.sourceIds).toEqual(["chola-q2fy26", "mahindra-finance-q4fy25"]);
    const range = claimIn(truckClaims, /3\.3–4\.8%/);
    expect(isCited(range)).toBe(false);
    expect(!isCited(range) && range.basis).toMatch(/4\.79%.*verification pass/);
    // The Shriram snippet (S55) has no Stage 3 figure, so nothing cites it for one.
    expect(truckClaims.filter((c) => isCited(c) && c.sourceIds.includes("shriram-rating"))).toEqual([]);
  });

  it("no new hardware: the design is a labelled assumption; the cited line states only what the snippets say", () => {
    expect(isCited(NO_NEW_HARDWARE_DESIGN)).toBe(false);
    expect(NO_NEW_HARDWARE_DESIGN.text).toMatch(/^No new hardware: SuprFleet would read/);
    expect(!isCited(NO_NEW_HARDWARE_DESIGN) && NO_NEW_HARDWARE_DESIGN.basis).toMatch(/Bill OCR is simulated/);
    expect(NO_NEW_HARDWARE.text).toBe(
      "The rails already exist: AIS-140 tracking is mandated on national-permit goods carriers registered from 1 January 2019, Tata Motors has connected 5 lakh commercial vehicles to Fleet Edge, more than 98% of national-highway toll fees go through FASTag, and e-way bills hit about 140 million in March 2026.",
    );
    expect(isCited(NO_NEW_HARDWARE) && NO_NEW_HARDWARE.sourceIds).toEqual(["ais140-rule-125h", "tata-fleet-edge", "fastag-98", "eway-bills"]);
  });

  it("Account Aggregators: the figures, without the 'works at scale' framing", () => {
    const aa = claimIn(LENDING_CLAIMS.consent, /28\.9 crore/);
    expect(aa.text).toBe("Account Aggregators had fulfilled 28.9 crore consents by 31 July 2025, and ₹1.67 lakh crore was disbursed via AA in FY25.");
    expect(isCited(aa) && aa.sourceIds).toEqual(["aa-consents-sahamati", "aa-fy25"]);
  });

  it("white-label consent managers: attributed to the firm that reads the draft Rules that way", () => {
    const c = claimIn(LENDING_CLAIMS.consent, /white-label/);
    expect(c.text).toBe(
      "Cyril Amarchand Mangaldas reads the draft DPDP Rules as giving Account Aggregators an opportunity to act as 'white-label' consent managers.",
    );
    expect(isCited(c) && c.sourceIds).toEqual(["aa-consent-manager"]);
  });

  it("the tiers page describes the spend as our estimate", () => {
    expect(BET_TIERS.description).toContain("what we estimate small owners spend today");
  });

  it("the Autopilot guardrail names the ladder's gate: at least 2 independent families", () => {
    const f = tierById("autopilot").features.join(" ");
    expect(f).toContain(`when the flag is High and at least ${GUARDRAIL_MIN_FAMILIES} independent families agree`);
    expect(f).not.toMatch(/two or more/);
  });

  it("every changed claim keeps its sourceIds or is an assumption with a basis", () => {
    const changed: Claim[] = [
      claimIn(BET_OVERVIEW.claims, /e-way bills/i),
      claimIn(BET_OVERVIEW.claims, /telemetry/),
      claimIn(BET_OVERVIEW.claims, /98%/),
      claimIn(BET_OVERVIEW.claims, /lakh crore/),
      LENDING_CLAIMS.role,
      claimIn(truckClaims, /BlackBuck/),
      claimIn(truckClaims, /consented lending partnership/),
      claimIn(truckClaims, /^Cholamandalam/),
      claimIn(truckClaims, /3\.3–4\.8%/),
      claimIn(truckClaims, /Used-vehicle/),
      NO_NEW_HARDWARE,
      NO_NEW_HARDWARE_DESIGN,
      claimIn(LENDING_CLAIMS.consent, /28\.9 crore/),
      claimIn(LENDING_CLAIMS.consent, /white-label/),
      PRICE_ANCHORS.currentSpend.claim,
      SPEND_LISTINGS,
      PRICE_ANCHORS.fleetxEntry.claim,
      FUEL_SENSOR_TODAY,
      whatsapp.claim,
      whatsapp.volume!,
    ];
    for (const c of changed) expectHonest(c);
    // A cited claim keeps the sources it had before the pass.
    const ids = (c: Claim) => (isCited(c) ? c.sourceIds : null);
    expect(ids(claimIn(BET_OVERVIEW.claims, /telemetry/))).toEqual(["ais140-rule-125h", "tata-fleet-edge"]);
    expect(ids(claimIn(BET_OVERVIEW.claims, /98%/))).toEqual(["fastag-98"]);
    expect(ids(claimIn(BET_OVERVIEW.claims, /lakh crore/))).toEqual(["aa-fy25"]);
    expect(ids(claimIn(LENDING_CLAIMS.consent, /28\.9 crore/))).toEqual(["aa-consents-sahamati", "aa-fy25"]);
    expect(ids(claimIn(LENDING_CLAIMS.consent, /white-label/))).toEqual(["aa-consent-manager"]);
    expect(ids(claimIn(truckClaims, /Used-vehicle/))).toEqual(["used-cv-cagr"]);
    expect(ids(FUEL_SENSOR_TODAY)).toEqual(["fuel-sensor-prices"]);
  });
});
