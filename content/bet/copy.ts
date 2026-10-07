/**
 * Copy for the bet section (TASK-21; docs/bet/bet-spec.md): route titles and descriptions, the
 * product line (§1, exact), and the few claims each page shell states. Every claim cites
 * content/bet/sources.ts or is labelled an assumption with its basis. English only (EXE39).
 */
import type { Claim } from "./sources";

/** bet-spec §1, word for word. */
export const BET_PRODUCT_LINE =
  "SuprFleet Munshi closes a small fleet owner's books every morning: it reconciles each truck's diesel, tolls and trips into a per-truck profit with evidence, in Hindi on WhatsApp, using telemetry the truck already sends. That verified ledger becomes the record a lender can finance against, with the owner's consent.";

/** The honesty line every bet page carries. */
export const PROTOTYPE_NOTE = "Prototype, simulated data";
export const PROTOTYPE_DETAIL =
  "Sharma Roadlines and its 24 trucks are simulated. Research figures are marked unverified until each page is opened and quoted.";

export interface BetPageCopy {
  /** The route; og:url and the canonical link. */
  path: string;
  /** The absolute <title>. */
  title: string;
  description: string;
  /** The small line above the h1. */
  eyebrow: string;
  h1: string;
  /** The one line under the h1: the product line or the page's thesis. */
  thesis: string;
  claims: readonly Claim[];
}

/** /bet: the overview (TASK-28 fills in the board, the loop and the roadmap). */
export const BET_OVERVIEW: BetPageCopy = {
  path: "/bet",
  title: "The bet: Munshi → credit · Urja",
  description:
    "Where Urja goes next: SuprFleet Munshi closes a small fleet owner's books every morning, and that verified ledger becomes the record a lender can finance against. A prototype on simulated data; research figures stay marked unverified until checked.",
  eyebrow: "SuprFleet 2030 · the bet",
  h1: "Munshi → credit",
  thesis: BET_PRODUCT_LINE,
  claims: [
    { text: "About 75% of India's roughly 3.5 million truck operators own fewer than five trucks.", sourceIds: ["zinka-prospectus"] },
    { text: "The telemetry is already on the truck: mandated AIS-140 tracking devices and factory OEM telematics.", sourceIds: ["ais140-rule-125h", "tata-fleet-edge"] },
    { text: "FASTag collects more than 98% of national-highway tolls.", sourceIds: ["fastag-98"] },
    { text: "About 140 million e-way bills are generated every month.", sourceIds: ["eway-bills"] },
    { text: "Consented lending runs at scale: ₹1.67 lakh crore went out through Account Aggregators in FY25.", sourceIds: ["aa-fy25"] },
    { text: "WhatsApp has more than 500 million users in India, and a utility message costs ₹0.145.", sourceIds: ["whatsapp-users", "whatsapp-pricing"] },
    {
      text: "Large language models make a Hindi munshi cheap to run.",
      assumption: true,
      basis: "Our cost-to-serve estimate: about 40 Gemini Flash answers per truck a month (bet-spec §7).",
    },
  ],
};

/** /bet/tiers (TASK-27 fills in the tier table and the price logic). */
export const BET_TIERS: BetPageCopy = {
  path: "/bet/tiers",
  title: "Tiers and who pays · Urja",
  description:
    "Free, Munshi, Pro and Autopilot: what each tier does for a truck, what it costs to serve, and why lending partners pay for the free tier. Prices are assumptions anchored on what small owners spend today.",
  eyebrow: "The bet · tiers",
  h1: "Four tiers, and who pays for each",
  thesis: "Owners pay for actions, not dashboards; lending partners pay for the free tier.",
  claims: [
    {
      text: "A small owner already spends about ₹150–300 per truck a month on a GPS plan and a khata app.",
      sourceIds: ["gps-loconav", "gps-wheelseye", "transportbook-pricing"],
    },
    { text: "Mid-market fleet software starts at ₹300–600 per vehicle a month.", sourceIds: ["fleetx-pricing"] },
    { text: "Measuring fuel today means a ₹8,000–12,500 sensor plus ₹400–750 a month in software.", sourceIds: ["fuel-sensor-prices"] },
    { text: "A referral or lending-service partner is a regulated role under the RBI's Digital Lending Directions, 2025.", sourceIds: ["rbi-digital-lending"] },
    {
      text: "Referral fees on consented loans pay for the free tier.",
      assumption: true,
      basis: "A fee of 0.5–1.5% of each funded loan; payout ranges vary and are unverified (bet-spec §7).",
    },
  ],
};

/** /trucks/[plate]: the lender view (TASK-26 fills in the ledger and the trust score). */
export const BET_TRUCK = {
  eyebrowPrefix: "Truck",
  h1Suffix: "the lender view",
  thesis: "A verified per-truck ledger is the record a lender can finance against, shared only with the owner's consent.",
  claims: [
    {
      text: "Commercial-vehicle lenders carry Stage 3 (bad-loan) rates of 3.3–4.8%.",
      sourceIds: ["chola-q2fy26", "mahindra-finance-q4fy25", "shriram-rating"],
    },
    { text: "Used-vehicle loans grew 15% a year from FY20 to FY25, against 11% for new ones.", sourceIds: ["used-cv-cagr"] },
    {
      text: "BlackBuck lends on its own operators' data in-house rather than buying it, so the credit step here is a consented lending partnership, not a data sale.",
      sourceIds: ["blackbuck-lending"],
    },
  ] satisfies readonly Claim[],
} as const;
