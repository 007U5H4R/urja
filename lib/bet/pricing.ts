/**
 * Tier pricing (TASK-24; docs/bet/bet-spec.md §7): cost to serve a truck, the willingness-to-pay
 * band from research, recovered ₹ per truck from the simulated fleet, and each tier's margin and
 * position. Pure and deterministic: every figure comes from content/bet or from `september()`.
 */
import { COST_INPUTS, EXAMPLE_LOAN, REFERRAL_FEE } from "@/content/bet/costs";
import type { Claim } from "@/content/bet/sources";
import { PRICE_ANCHORS, type PriceAnchor, type Tier, type TierId } from "@/content/bet/tiers";
import { istMin } from "@/lib/clock";
import { september } from "@/lib/data/aggregates";
import { FLEET } from "@/lib/data/fleet";
import { formatDateIST, formatINR } from "@/lib/format";

const MONTH_DAYS = 30;

/** ₹ per truck per month: the sum of the cost inputs (≈ ₹78). */
export function costToServe(): number {
  return COST_INPUTS.reduce((sum, c) => sum + c.inrPerTruckMonth, 0);
}

export interface RecoveredPerTruck {
  /** September 1–27 recovered ₹ for the whole fleet. */
  septemberRecoveredInr: number;
  trucks: number;
  /** Days in the September window, inclusive: one running total per day. */
  days: number;
  /** Recovered ₹ per truck, scaled to a 30-day month and rounded. */
  perTruckMonthInr: number;
  label: string;
}

/** '1–27 Sep' for two 'YYYY-MM-DD' keys in one month, else '30 Aug–27 Sep'. */
function windowLabel(from: string, to: string): string {
  const date = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return formatDateIST(istMin(y, m, d), "day-month");
  };
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${sameMonth ? Number(from.slice(8)) : date(from)}–${date(to)}`;
}

/** What Urja recovered per truck per month on the simulated fleet: a ceiling check on price. */
export function recoveredPerTruck(): RecoveredPerTruck {
  const s = september();
  const trucks = FLEET.length;
  const days = s.cumulativeL.length;
  const perTruckMonthInr = Math.round(((s.recoveredInr / trucks) * MONTH_DAYS) / days);
  return {
    septemberRecoveredInr: s.recoveredInr,
    trucks,
    days,
    perTruckMonthInr,
    label: `Recovered per truck per month on the simulated fleet: ${formatINR(s.recoveredInr)} recovered ${windowLabel(s.fromDay, s.toDay)} ÷ ${trucks} trucks, scaled to ${MONTH_DAYS} days.`,
  };
}

export interface WtpBand {
  lowInr: number;
  highInr: number;
  claim: Claim;
  recovered: RecoveredPerTruck;
}

/** The willingness-to-pay band (₹150–300 already spent on GPS plus khata), and recovered ₹ beside it. */
export function wtpBand(): WtpBand {
  const { lowInr, highInr, claim } = PRICE_ANCHORS.currentSpend;
  return { lowInr, highInr, claim, recovered: recoveredPerTruck() };
}

export type BandPosition = "free" | "below" | "within" | "above";

function position(priceInr: number, band: Pick<PriceAnchor, "lowInr" | "highInr">): BandPosition {
  if (priceInr === 0) return "free";
  if (priceInr < band.lowInr) return "below";
  return priceInr <= band.highInr ? "within" : "above";
}

export interface TierPrice {
  id: TierId;
  priceInr: number;
  costInr: number;
  /** Gross margin per truck per month; negative for Free. */
  marginInr: number;
  /** Whole % of price; null for Free. */
  marginPct: number | null;
  vsWtp: BandPosition;
  vsFleetx: BandPosition;
  /** Price as a whole % of recovered ₹ per truck per month; 0 when nothing was recovered. */
  shareOfRecoveredPct: number;
  subsidisedBy: Tier["subsidisedBy"];
}

export function priceTier(tier: Tier): TierPrice {
  const costInr = costToServe();
  const marginInr = tier.priceInr - costInr;
  const recovered = recoveredPerTruck().perTruckMonthInr;
  return {
    id: tier.id,
    priceInr: tier.priceInr,
    costInr,
    marginInr,
    marginPct: tier.priceInr > 0 ? Math.round((marginInr / tier.priceInr) * 100) : null,
    vsWtp: position(tier.priceInr, PRICE_ANCHORS.currentSpend),
    vsFleetx: position(tier.priceInr, PRICE_ANCHORS.fleetxEntry),
    shareOfRecoveredPct: recovered ? Math.round((tier.priceInr / recovered) * 100) : 0,
    subsidisedBy: tier.subsidisedBy,
  };
}

export interface FreeSubsidy {
  loanInr: number;
  feeLowInr: number;
  feeHighInr: number;
  /** One truck on Free for a year: cost to serve × 12. */
  freeCostPerYearInr: number;
  /** Whole years one referral fee covers, rounded down. */
  yearsLow: number;
  yearsHigh: number;
}

/** How one referral fee on the example loan pays for one truck's Free tier. */
export function freeSubsidy(): FreeSubsidy {
  const loanInr = EXAMPLE_LOAN.amountInr;
  const feeLowInr = Math.round((loanInr * REFERRAL_FEE.lowPct) / 100);
  const feeHighInr = Math.round((loanInr * REFERRAL_FEE.highPct) / 100);
  const freeCostPerYearInr = costToServe() * 12;
  return {
    loanInr,
    feeLowInr,
    feeHighInr,
    freeCostPerYearInr,
    yearsLow: Math.floor(feeLowInr / freeCostPerYearInr),
    yearsHigh: Math.floor(feeHighInr / freeCostPerYearInr),
  };
}
