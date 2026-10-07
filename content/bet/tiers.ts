/**
 * The four SuprFleet tiers (TASK-24; docs/bet/bet-spec.md §7, frozen): what each does for a truck
 * on the autonomy ladder, and what it costs per truck per month. Prices are assumptions anchored on
 * listed prices (our estimate of what a small owner spends today) and fleet software's cited entry
 * tier; every claim is a `Claim`.
 * lib/bet/pricing.ts works out cost, margin and the band each price sits in.
 */
import { formatINR } from "@/lib/format";
import { GUARDRAIL_MIN_FAMILIES } from "./ladder";
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

/** Anchors for the prices: a band, in ₹ per truck per month, and its claim (cited, or an assumption). */
export interface PriceAnchor {
  lowInr: number;
  highInr: number;
  claim: Claim;
}

/**
 * The listed prices behind the spend estimate: a GPS tracker, a GPS with a year's plan, and a khata
 * app's premium plan. Cited; the ₹150–300 a month drawn from them is our own estimate.
 */
export const SPEND_LISTINGS: Claim = {
  text: "Listed prices: a LocoNav wired GPS tracker at ₹2,184, a WheelsEye truck GPS with a 1-year plan at ₹3,850, and TransportBook's premium plan at ₹4,999 a year.",
  sourceIds: ["gps-loconav", "gps-wheelseye", "transportbook-pricing"],
};

export const PRICE_ANCHORS: { currentSpend: PriceAnchor; fleetxEntry: PriceAnchor } = {
  /** The willingness-to-pay band: what an owner already pays for GPS plus a khata app (our estimate). */
  currentSpend: {
    lowInr: 150,
    highInr: 300,
    claim: {
      text: "A small owner already spends about ₹150–300 per truck a month on a GPS plan and a khata app.",
      assumption: true,
      basis:
        "Our estimate from listed prices (a LocoNav tracker, a WheelsEye tracker with a year's plan, TransportBook's premium khata plan), spread over a year and a small fleet's trucks; not a measured spend (research report §8).",
    },
  },
  fleetxEntry: {
    lowInr: 300,
    highInr: 600,
    claim: { text: "Fleet software's entry tier typically costs ₹300–600 per vehicle a month.", sourceIds: ["fleetx-pricing"] },
  },
};

const PRICE_BASIS = "Set against our ₹150–300 spend estimate and the ₹300–600 software entry tier; untested with owners (bet-spec §7).";

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
      text: "Free costs the owner nothing; referral fees on consented loans pay for it once a lender signs, and the paid tiers and pilot budget until then.",
      assumption: true,
      basis: "The referral fee below, whose payout ranges are unverified (bet-spec §7).",
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
      `Guardrails: auto-hold a driver advance above ${formatINR(GUARDRAIL_ADVANCE_INR)} when the flag is High and at least ${GUARDRAIL_MIN_FAMILIES} independent families agree`,
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

/** The tier table's hardware line: our design, so an assumption. Bill OCR is simulated in the prototype. */
export const NO_NEW_HARDWARE_DESIGN: Claim = {
  text: "No new hardware: SuprFleet would read the AIS-140 device or OEM telematics a truck already has, plus FASTag, e-way bills and photographed fuel bills.",
  assumption: true,
  basis:
    "Our design (bet-spec §7). It holds only for trucks that already carry a tracker or OEM telematics: AIS-140 is mandated on national-permit goods carriers registered from 1 Jan 2019, and enforcement is uneven (research report §7.3). Bill OCR is simulated in this prototype.",
};

/** The feeds that design reads, as far as each source's snippet goes. */
export const NO_NEW_HARDWARE: Claim = {
  text: "The rails already exist: AIS-140 tracking is mandated on national-permit goods carriers registered from 1 January 2019, Tata Motors has connected 5 lakh commercial vehicles to Fleet Edge, more than 98% of national-highway toll fees go through FASTag, and e-way bills hit about 140 million in March 2026.",
  sourceIds: ["ais140-rule-125h", "tata-fleet-edge", "fastag-98", "eway-bills"],
};

/** What measuring fuel costs today, without stream fusion: a sensor plus monthly software. */
export const FUEL_SENSOR_TODAY: Claim = {
  text: "Fuel-level sensors are listed at ₹8,000–12,500, and fuel-tracking software at ₹400–750 a month.",
  sourceIds: ["fuel-sensor-prices"],
};

/** Every claim the tiers make: anchors, prices and the hardware lines. */
export const PRICING_CLAIMS: readonly Claim[] = [
  PRICE_ANCHORS.currentSpend.claim,
  SPEND_LISTINGS,
  PRICE_ANCHORS.fleetxEntry.claim,
  ...TIERS.map((t) => t.priceClaim),
  NO_NEW_HARDWARE_DESIGN,
  NO_NEW_HARDWARE,
  FUEL_SENSOR_TODAY,
];

/** The tier table's caption and row labels, in row order. */
export const TIER_TABLE = {
  caption: "Four tiers: price, what each adds, and who pays",
  rowLabels: {
    price: "Price",
    adds: "What it adds",
    autonomy: "Autonomy it unlocks",
    cost: "Cost to serve",
    margin: "Margin",
    shareOfRecovered: "Share of recovered ₹",
    vsWtp: "Against our spend estimate",
    vsFleetx: "Against the software entry tier",
    paidBy: "Who pays",
    priceBasis: "Price basis",
  },
  /** The row that rests on the simulated fleet's recovered ₹: it carries the Simulated tag. */
  simulatedRow: "shareOfRecovered",
} as const;
