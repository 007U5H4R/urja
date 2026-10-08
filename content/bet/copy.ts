/**
 * Copy for the bet section (TASK-21; docs/bet/bet-spec.md): route titles and descriptions, the
 * product line (§1, exact), and the few claims each page shell states. Every claim cites
 * content/bet/sources.ts or is labelled an assumption with its basis. English only (EXE39).
 */
import { LENDING_CLAIMS } from "./costs";
import type { Claim } from "./sources";
import { FUEL_SENSOR_TODAY, PRICE_ANCHORS, SPEND_LISTINGS, tierById } from "./tiers";

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
    {
      text: "Many trucks already send telemetry: AIS-140 tracking devices are mandated on national-permit goods carriers registered from 1 January 2019, and Tata Motors has connected 5 lakh commercial vehicles to Fleet Edge.",
      sourceIds: ["ais140-rule-125h", "tata-fleet-edge"],
    },
    { text: "More than 98% of national-highway toll fees are collected electronically, through FASTag.", sourceIds: ["fastag-98"] },
    { text: "E-way bills hit a record of about 140 million in March 2026.", sourceIds: ["eway-bills"] },
    { text: "₹1.67 lakh crore of loans were disbursed via Account Aggregators in FY25.", sourceIds: ["aa-fy25"] },
    { text: "WhatsApp has more than 500 million users in India, and a utility message costs ₹0.145.", sourceIds: ["whatsapp-users", "whatsapp-pricing"] },
    {
      text: "Large language models make a Hindi munshi cheap to run.",
      assumption: true,
      basis: "Our cost-to-serve estimate: about 40 Gemini Flash answers per truck a month (bet-spec §7).",
    },
  ],
};

/** A bet tab page's head and metadata (TASK-32, EXE49); its claims live with its sections. */
export type BetTabPageCopy = Omit<BetPageCopy, "claims">;

/** /bet/market: the board, what we dropped, structural vs hype. */
export const BET_MARKET: BetTabPageCopy = {
  path: "/bet/market",
  title: "Where we play · Urja",
  description:
    "The board of fleet segments and jobs, the one cell SuprFleet Munshi plays in first, the candidates we dropped, and which shifts are structural and which are hype. Research figures stay marked unverified.",
  eyebrow: "The bet · where we play",
  h1: "Where we play",
  thesis: "Small truck owners' books first; every other cell waits, or goes to someone who already serves it.",
};

/** /bet/product: the 5–10x and streams × autonomy. */
export const BET_PRODUCT: BetTabPageCopy = {
  path: "/bet/product",
  title: "The product · Urja",
  description:
    "Why SuprFleet Munshi is 5–10x better than a month-end register, and how each data stream raises confidence while independent ones must agree before autonomy unlocks, from a Check to an automatic hold. A prototype on simulated data.",
  eyebrow: "The bet · product",
  h1: "The product",
  thesis: "A morning answer with evidence, from data the truck already sends; autonomy only where independent streams agree.",
};

/** /bet/plan: the roadmap, the metrics and H1–H7. */
export const BET_PLAN: BetTabPageCopy = {
  path: "/bet/plan",
  title: "Roadmap, metrics and hypotheses · Urja",
  description:
    "The three phases and what we are not building, the North Star of verified truck-months with its guardrails, and the seven hypotheses inside the bet, all untested by field calls.",
  eyebrow: "The bet · plan",
  h1: "Roadmap, metrics and what we're testing",
  thesis: "Three phases, one North Star, and seven bets inside the bet that no field call has tested yet.",
};

/** /bet/artifacts: the deliverables, one line each. */
export const BET_ARTIFACTS: BetTabPageCopy = {
  path: "/bet/artifacts",
  title: "Artifacts · Urja",
  description:
    "The written work behind this prototype: the strategy doc, the PRD, the slide deck, the research report, the bet spec and the decisions log, one line each.",
  eyebrow: "The bet · artifacts",
  h1: "Artifacts",
  thesis: "The written work behind this prototype, one line each.",
};

/** /bet/tiers (TASK-27 fills in the tier table and the price logic). */
export const BET_TIERS: BetPageCopy = {
  path: "/bet/tiers",
  title: "Tiers and who pays · Urja",
  description:
    "Free, Munshi, Pro and Autopilot: what each tier does for a truck, what it costs to serve, and why lending partners pay for the free tier. Prices are assumptions anchored on what we estimate small owners spend today.",
  eyebrow: "The bet · tiers",
  h1: "Four tiers, and who pays for each",
  thesis: "Owners pay for actions, not dashboards; lending partners pay for the free tier.",
  // The same Claim objects the tier view renders, so the copy and the page can't drift apart.
  claims: [
    PRICE_ANCHORS.currentSpend.claim,
    SPEND_LISTINGS,
    PRICE_ANCHORS.fleetxEntry.claim,
    FUEL_SENSOR_TODAY,
    LENDING_CLAIMS.role,
    tierById("free").priceClaim,
  ],
};

/** /trucks/[plate]: the lender view (TASK-26 fills in the ledger and the trust score). */
export const BET_TRUCK = {
  eyebrowPrefix: "Truck",
  h1Suffix: "the lender view",
  thesis: "A verified per-truck ledger is the record a lender can finance against, shared only with the owner's consent.",
  claims: [
    {
      text: "Cholamandalam reports Stage 3 (90+ days overdue) at 3.35% (Sep 2025), and Mahindra Finance at 3.7% (Mar 2025).",
      sourceIds: ["chola-q2fy26", "mahindra-finance-q4fy25"],
    },
    {
      text: "We take Stage 3 (bad-loan) rates at large vehicle financiers to run about 3.3–4.8%.",
      assumption: true,
      basis:
        "Cholamandalam's 3.35% and Mahindra Finance's 3.7%, plus Shriram Finance's commercial-vehicle Stage 3 of 4.79%, which the research report records from its rating rationale (§7.4) but our snippet of that source does not quote; to confirm in the verification pass.",
    },
    { text: "Used-vehicle loan books grew 15% a year from FY20 to FY25, against 11% for new-vehicle loans.", sourceIds: ["used-cv-cagr"] },
    {
      text: "BlackBuck's lending arm says real-time behavioural and transactional data enables faster underwriting and loan disbursals.",
      sourceIds: ["blackbuck-lending"],
    },
    {
      text: "SuprFleet's credit step is a consented lending partnership, not a data sale.",
      assumption: true,
      basis: "Our design choice: the research found no lender paying a third party for telematics data (research report §7.4, H4).",
    },
  ] satisfies readonly Claim[],
} as const;
