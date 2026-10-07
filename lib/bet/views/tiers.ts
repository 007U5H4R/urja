/**
 * The /bet/tiers view model (TASK-24; docs/bet/bet-spec.md §7). Components render these fields
 * and nothing else: every ₹ is formatted here from lib/bet/pricing.ts and content/bet.
 */
import { COST_INPUTS, EXAMPLE_LOAN, LENDING_CLAIMS, REFERRAL_FEE, type CostInput } from "@/content/bet/costs";
import { citedSourceIds, isCited, type Claim } from "@/content/bet/sources";
import { NO_NEW_HARDWARE, PRICE_ANCHORS, PRICING_CLAIMS, TIERS, type Payer, type TierId } from "@/content/bet/tiers";
import { formatINR } from "@/lib/format";
import { costToServe, freeSubsidy, priceTier, wtpBand, type BandPosition } from "../pricing";

export interface TierRowView {
  id: TierId;
  name: string;
  /** "₹299". */
  price: string;
  unit: string;
  levels: string;
  features: readonly string[];
  cost: string;
  /** "₹221", or "−₹78" for Free. */
  margin: string;
  /** "74%", or "" for Free. */
  marginPct: string;
  /** Where the price sits against today's ₹150–300 spend. */
  vsWtp: string;
  /** Where the price sits against Fleetx's ₹300–600 entry tier. */
  vsFleetx: string;
  /** "30% of recovered ₹", or "" for Free. */
  shareOfRecoveredText: string;
  paidBy: Payer;
  priceClaim: Claim;
  priceStatus: Status;
}

/** One bar group per tier: cost to serve, price, and the WTP band behind them. */
export interface TierChartPoint {
  tierId: TierId;
  name: string;
  costInr: number;
  priceInr: number;
  wtpLowInr: number;
  wtpHighInr: number;
}

export interface CostRowView {
  /** The cost input's id: a stable React key. */
  id: CostInput["id"];
  label: string;
  amount: string;
  status: Status;
  claim: Claim;
}

export interface WhoPaysRow {
  payer: "Owner" | "Lending partner" | "Consent basis";
  pays: string;
  /** The tiers this payer funds; "" for the consent row. */
  funds: string;
  claims: readonly Claim[];
}

export interface TiersView {
  rows: TierRowView[];
  chart: TierChartPoint[];
  costs: { rows: CostRowView[]; total: string };
  wtp: string;
  recovered: { value: string; label: string };
  /** One sentence: what one referral fee buys in Free. */
  subsidy: string;
  whoPays: WhoPaysRow[];
  noNewHardware: string;
  claims: Claim[];
  /** The page's numbered source list, in order of first citation. */
  sourceIds: string[];
}

type Status = "Cited" | "Assumption";

const UNIT = "per truck per month";
const PLAIN = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const LAKH = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** One rupee range style, as bet-spec writes it: "₹150–300", "₹5,000–15,000". */
function inrRange(low: number, high: number): string {
  return `${formatINR(low)}–${PLAIN.format(Math.round(high))}`;
}

/** "₹10 lakh". */
function inrLakh(n: number): string {
  return `₹${LAKH.format(n / 100_000)} lakh`;
}

function status(claim: Claim): Status {
  return isCited(claim) ? "Cited" : "Assumption";
}

function vsWtpText(p: BandPosition, band: string): string {
  switch (p) {
    case "free":
      return "Free to the owner";
    case "below":
      return `Below today's ${band}`;
    case "within":
      return `Within today's ${band}`;
    case "above":
      return `Above today's ${band}: priced on actions`;
  }
}

function vsFleetxText(p: BandPosition, band: string): string {
  if (p === "free") return "Free to the owner";
  const where = { below: "Below", within: "Within", above: "Above" }[p];
  return `${where} Fleetx's ${band}`;
}

export function getTiersView(): TiersView {
  const cost = costToServe();
  const band = wtpBand();
  const bandText = `${inrRange(band.lowInr, band.highInr)} spend`;
  const fleetx = PRICE_ANCHORS.fleetxEntry;
  const fleetxText = `${inrRange(fleetx.lowInr, fleetx.highInr)} entry tier`;
  const subsidy = freeSubsidy();

  const rows = TIERS.map((t): TierRowView => {
    const p = priceTier(t);
    return {
      id: t.id,
      name: t.name,
      price: formatINR(p.priceInr),
      unit: UNIT,
      levels: t.levelsLabel,
      features: t.features,
      cost: formatINR(p.costInr),
      margin: formatINR(p.marginInr),
      marginPct: p.marginPct === null ? "" : `${p.marginPct}%`,
      vsWtp: vsWtpText(p.vsWtp, bandText),
      vsFleetx: vsFleetxText(p.vsFleetx, fleetxText),
      shareOfRecoveredText: p.priceInr > 0 ? `${p.shareOfRecoveredPct}% of recovered ₹` : "",
      paidBy: t.paidBy,
      priceClaim: t.priceClaim,
      priceStatus: status(t.priceClaim),
    };
  });

  const chart = TIERS.map((t): TierChartPoint => ({
    tierId: t.id,
    name: t.name,
    costInr: cost,
    priceInr: t.priceInr,
    wtpLowInr: band.lowInr,
    wtpHighInr: band.highInr,
  }));

  const costRows = COST_INPUTS.map((c): CostRowView => ({
    id: c.id,
    label: c.label,
    amount: formatINR(c.inrPerTruckMonth),
    status: status(c.claim),
    claim: c.claim,
  }));

  const paid = TIERS.filter((t) => t.paidBy === "owner");
  const free = TIERS.filter((t) => t.subsidisedBy === "lending-partner");
  const names = (ts: typeof TIERS) => {
    const n = ts.map((t) => t.name);
    return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n.join("");
  };
  const priceRange = inrRange(Math.min(...paid.map((t) => t.priceInr)), Math.max(...paid.map((t) => t.priceInr)));

  const whoPays: WhoPaysRow[] = [
    {
      payer: "Owner",
      pays: `${names(paid)}: ${priceRange} ${UNIT}`,
      funds: names(paid),
      claims: paid.map((t) => t.priceClaim),
    },
    {
      payer: "Lending partner",
      pays: `A referral fee of ${REFERRAL_FEE.lowPct}–${REFERRAL_FEE.highPct}% of each consented, funded loan`,
      funds: names(free),
      claims: [LENDING_CLAIMS.role, REFERRAL_FEE.claim],
    },
    {
      payer: "Consent basis",
      // Our planned consent flow, not a built or reviewed one: labelled as such.
      pays: "Assumption: the owner consents before any data is shared, recorded under the DPDP Act and carried by an Account Aggregator, under the RBI's Digital Lending Directions, 2025",
      funds: "",
      claims: LENDING_CLAIMS.consent,
    },
  ];

  const claims: Claim[] = [
    ...PRICING_CLAIMS,
    ...COST_INPUTS.map((c) => c.claim),
    EXAMPLE_LOAN.claim,
    REFERRAL_FEE.claim,
    LENDING_CLAIMS.role,
    ...LENDING_CLAIMS.consent,
  ];

  return {
    rows,
    chart,
    costs: { rows: costRows, total: formatINR(cost) },
    wtp: `${inrRange(band.lowInr, band.highInr)} ${UNIT}`,
    recovered: { value: formatINR(band.recovered.perTruckMonthInr), label: band.recovered.label },
    subsidy: `One ${inrLakh(subsidy.loanInr)} used-truck loan pays ${inrRange(subsidy.feeLowInr, subsidy.feeHighInr)} in referral fees, which covers ${subsidy.yearsLow}–${subsidy.yearsHigh} years of Free on that truck (${formatINR(subsidy.freeCostPerYearInr)} a year).`,
    whoPays,
    noNewHardware: NO_NEW_HARDWARE.text,
    claims,
    sourceIds: citedSourceIds(claims),
  };
}
