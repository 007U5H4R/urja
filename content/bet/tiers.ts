/**
 * The four SuprFleet tiers (TASK-24; docs/bet/bet-spec.md §7, frozen): what each does for a truck
 * on the autonomy ladder, and what it costs per truck per month. Prices are assumptions anchored on
 * research (what a small owner spends today, and Fleetx's entry tier); every claim is a `Claim`.
 * lib/bet/pricing.ts works out cost, margin and the band each price sits in.
 */
import { formatINR } from "@/lib/format";
import type { Claim } from "./sources";

export type TierId = "free" | "munshi" | "pro" | "autopilot";
/** The autonomy ladder (§7). L5, self-closing settlement, is future and in no tier. */
export type LadderLevel = "L1" | "L2" | "L3" | "L4";
export type Payer = "owner" | "lending-partner";

export interface Tier {
  id: TierId;
  name: string;
  /** ₹ per truck per month. */
  priceInr: number;
  levels: readonly LadderLevel[];
  /** The tier table's ladder cell. */
  levelsLabel: string;
  /** Munshi and up close the books every morning. */
  includesDailyClose: boolean;
  features: readonly string[];
  /** Who pays for the tier. */
  paidBy: Payer;
  /** Set on Free, which runs below cost: referral fees on consented loans pay for it. */
  subsidisedBy: "lending-partner" | null;
  priceClaim: Claim;
}

/** L4: auto-hold a driver advance above this when the flag is High (§7). */
export const GUARDRAIL_ADVANCE_INR = 2000;

/** Research anchors for the prices: a band, in ₹ per truck per month, and its citation. */
export interface PriceAnchor {
  lowInr: number;
  highInr: number;
  claim: Claim;
}

export const PRICE_ANCHORS: { currentSpend: PriceAnchor; fleetxEntry: PriceAnchor } = {
  /** The willingness-to-pay band: what an owner already pays for GPS plus a khata app. */
  currentSpend: {
    lowInr: 150,
    highInr: 300,
    claim: {
      text: "A small owner already spends about ₹150–300 per truck a month on a GPS plan and a khata app.",
      sourceIds: ["gps-loconav", "gps-wheelseye", "transportbook-pricing"],
    },
  },
  fleetxEntry: {
    lowInr: 300,
    highInr: 600,
    claim: { text: "Mid-market fleet software starts at ₹300–600 per vehicle a month.", sourceIds: ["fleetx-pricing"] },
  },
};

const PRICE_BASIS =
  "Chosen against today's ₹150–300 spend on GPS plus khata and Fleetx's ₹300–600 entry tier; untested with owners (bet-spec §7).";

function priceClaim(name: string, priceInr: number): Claim {
  return { text: `${name} costs ${formatINR(priceInr)} per truck per month.`, assumption: true, basis: PRICE_BASIS };
}

export const TIERS: readonly Tier[] = [
  {
    id: "free",
    name: "Free",
    priceInr: 0,
    levels: ["L1"],
    levelsLabel: "L1",
    includesDailyClose: false,
    features: ["Morning brief on WhatsApp", "Flags with evidence", "Ask Urja about any truck or trip"],
    paidBy: "lending-partner",
    subsidisedBy: "lending-partner",
    priceClaim: {
      text: "Free costs the owner nothing; referral fees on consented loans pay for it.",
      assumption: true,
      basis: "A lending-partner referral fee of 0.5–1.5% of each funded loan; payout ranges vary and are unverified (bet-spec §7).",
    },
  },
  {
    id: "munshi",
    name: "Munshi",
    priceInr: 299,
    levels: ["L1", "L2"],
    levelsLabel: "L1–L2 and the daily close",
    includesDailyClose: true,
    features: [
      "Everything in Free",
      "The daily close: each truck's books reconciled every morning",
      "Ask the driver about a flag",
      "Hold the fuel card when a flag is Likely or High",
      "Recover from settlement when a flag is High or confirmed",
    ],
    paidBy: "owner",
    subsidisedBy: null,
    priceClaim: priceClaim("Munshi", 299),
  },
  {
    id: "pro",
    name: "Pro",
    priceInr: 499,
    levels: ["L1", "L2", "L3"],
    levelsLabel: "Adds L3 and benchmarks vs similar fleets",
    includesDailyClose: true,
    features: [
      "Everything in Munshi",
      "Corrective SOPs: block a pump, set a route diesel norm, a night-stop rule",
      "Benchmarks against similar fleets",
    ],
    paidBy: "owner",
    subsidisedBy: null,
    priceClaim: priceClaim("Pro", 499),
  },
  {
    id: "autopilot",
    name: "Autopilot",
    priceInr: 799,
    levels: ["L1", "L2", "L3", "L4"],
    levelsLabel: "Adds L4 guardrails",
    includesDailyClose: true,
    features: [
      "Everything in Pro",
      `Guardrails: auto-hold a driver advance above ${formatINR(GUARDRAIL_ADVANCE_INR)} when the flag is High and two or more stream families agree`,
      "One-tap owner override on every guardrail",
    ],
    paidBy: "owner",
    subsidisedBy: null,
    priceClaim: priceClaim("Autopilot", 799),
  },
];

/** The tier with this id; throws on an unknown id. */
export function tierById(id: TierId): Tier {
  const t = TIERS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown tier id: ${id}`);
  return t;
}

/** The tier table's hardware line. Bill OCR is simulated in the prototype. */
export const NO_NEW_HARDWARE: Claim = {
  text: "No new hardware: uses the mandated AIS-140 device or OEM telematics, FASTag, e-way bills and bill OCR.",
  sourceIds: ["ais140-rule-125h", "tata-fleet-edge", "fastag-98", "eway-bills"],
};

/** Every claim the tiers make: anchors, prices and the hardware line. */
export const PRICING_CLAIMS: readonly Claim[] = [
  PRICE_ANCHORS.currentSpend.claim,
  PRICE_ANCHORS.fleetxEntry.claim,
  ...TIERS.map((t) => t.priceClaim),
  NO_NEW_HARDWARE,
];
