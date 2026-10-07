/**
 * The /bet/tiers view model (TASK-24; docs/bet/bet-spec.md §7). Components render these fields
 * and nothing else: every ₹ is formatted here from lib/bet/pricing.ts and content/bet.
 */
import { COST_INPUTS, EXAMPLE_LOAN, LENDING_CLAIMS, REFERRAL_FEE, type CostInput } from "@/content/bet/costs";
import { LADDER_LEVELS } from "@/content/bet/ladder";
import { citedSourceIds, isCited, type Claim } from "@/content/bet/sources";
import {
  FUEL_SENSOR_TODAY,
  NO_NEW_HARDWARE,
  NO_NEW_HARDWARE_DESIGN,
  PRICE_ANCHORS,
  SPEND_LISTINGS,
  TIER_TABLE,
  TIERS,
  type Payer,
  type TierId,
} from "@/content/bet/tiers";
import { formatINR } from "@/lib/format";
import { costToServe, freeSubsidy, priceTier, wtpBand, type BandPosition } from "../pricing";

export interface TierRowView {
  id: TierId;
  name: string;
  /** "₹299". */
  price: string;
  unit: string;
  levels: string;
  /** The rung this tier unlocks on the autonomy ladder: "L2 · Deterministic action". */
  autonomy: string;
  features: readonly string[];
  cost: string;
  /** "₹221", or "−₹78" for Free. */
  margin: string;
  /** "74%", or "" for Free. */
  marginPct: string;
  /** Where the price sits against our ₹150–300 spend estimate. */
  vsWtp: string;
  /** Where the price sits against fleet software's ₹300–600 entry tier. */
  vsFleetx: string;
  /** "30% of recovered ₹", or "" for Free. */
  shareOfRecoveredText: string;
  paidBy: Payer;
  /** "The owner", or "Lending partners, through referral fees" for Free. */
  paidByText: string;
  priceClaim: Claim;
  priceStatus: Status;
}

/**
 * The price-logic chart: one ₹ axis, each tier's price as a dot, against cost to serve and
 * recovered ₹ (lines) and our spend estimate and the software entry tier (bands).
 */
export interface PriceChartView {
  /** The chart's accessible name. */
  label: string;
  /** What the chart shows, in one paragraph: its text alternative. */
  summary: string;
  /** The axis runs ₹0 → maxInr. */
  maxInr: number;
  ticks: { inr: number; label: string }[];
  marks: { id: "cost" | "recovered"; inr: number; label: string }[];
  bands: { id: "wtp" | "fleetx"; lowInr: number; highInr: number; label: string }[];
  tiers: { tierId: TierId; name: string; priceInr: number; price: string }[];
}

export interface CostRowView {
  /** The cost input's id: a stable React key. */
  id: CostInput["id"];
  label: string;
  amount: string;
  /** The line's claim, then any labelled assumption it also rests on (WhatsApp's message volume). */
  claims: Claim[];
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
  /** The tier table's caption and row labels. */
  table: typeof TIER_TABLE;
  costs: { rows: CostRowView[]; total: string };
  recovered: { value: string; label: string };
  /** One sentence: what one referral fee buys in Free. */
  subsidy: string;
  whoPays: WhoPaysRow[];
  /** The no-new-hardware design (an assumption), the feeds it reads (cited), and what measuring fuel costs without it. */
  hardware: { design: Claim; line: Claim; today: Claim };
  /** The price anchors: the spend estimate, the listings behind it, the software entry tier. */
  anchors: Claim[];
  priceChart: PriceChartView;
  /** One referral fee, worked: loan → fee → years of Free. */
  subsidySteps: { label: string; value: string }[];
  subsidyClaims: Claim[];
  claims: Claim[];
  /** The page's numbered source list, in order of first citation. */
  sourceIds: string[];
}

type Status = "Cited" | "Assumption";

const UNIT = "per truck per month";
const PAID_BY: Record<Payer, string> = { owner: "The owner", "lending-partner": "Lending partners, through referral fees" };
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
      return `Below our ${band}`;
    case "within":
      return `Within our ${band}`;
    case "above":
      return `Above our ${band}: priced on actions`;
  }
}

function vsFleetxText(p: BandPosition, band: string): string {
  if (p === "free") return "Free to the owner";
  const where = { below: "Below", within: "Within", above: "Above" }[p];
  return `${where} the ${band}`;
}

/** "Munshi", "Munshi and Pro", "Munshi, Pro and Autopilot". */
function andList(items: readonly string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items.join("");
}

/** The level a tier unlocks: the top rung it includes, named from the ladder. */
function autonomyText(levels: readonly string[]): string {
  const top = levels[levels.length - 1];
  const level = LADDER_LEVELS.find((l) => l.id === top);
  return level ? `${level.id} · ${level.name}` : top;
}

const TICK_STEP_INR = 250;

function priceChart(cost: number, recovered: number, band: { lowInr: number; highInr: number }): PriceChartView {
  const fleetx = PRICE_ANCHORS.fleetxEntry;
  const prices = TIERS.map((t) => t.priceInr);
  // Headroom above the largest value, rounded up to a whole tick.
  const top = Math.max(recovered, fleetx.highInr, ...prices) * 1.1;
  const maxInr = Math.ceil(top / TICK_STEP_INR) * TICK_STEP_INR;
  const ticks = Array.from({ length: maxInr / TICK_STEP_INR + 1 }, (_, i) => {
    const inr = i * TICK_STEP_INR;
    return { inr, label: formatINR(inr) };
  });

  const tiers = TIERS.map((t) => ({ tierId: t.id, name: t.name, priceInr: t.priceInr, price: formatINR(t.priceInr) }));
  const paid = tiers.filter((t) => t.priceInr > 0);
  const free = tiers.filter((t) => t.priceInr === 0);
  const named = (ts: typeof tiers) => andList(ts.map((t) => `${t.name} (${t.price})`));
  const verb = (ts: typeof tiers, one: string, many: string) => (ts.length === 1 ? one : many);
  const bandText = `our ${inrRange(band.lowInr, band.highInr)} spend estimate`;

  const aboveCost = paid.every((t) => t.priceInr > cost);
  const belowRecovered = paid.every((t) => t.priceInr < recovered);
  const parts: string[] = [];
  parts.push(
    aboveCost && belowRecovered
      ? `Every paid tier is priced above the ${formatINR(cost)} cost to serve and below the ${formatINR(recovered)} recovered per truck a month on the simulated fleet.`
      : `Not every paid tier sits between the ${formatINR(cost)} cost to serve and the ${formatINR(recovered)} recovered per truck a month on the simulated fleet.`,
  );
  const groups = (["below", "within", "above"] as const)
    .map((where) => ({ where, ts: paid.filter((t) => wherePrice(t.priceInr, band) === where) }))
    .filter((g) => g.ts.length > 0);
  const clauses = groups.map((g, i) => {
    const target = i === 0 ? bandText : "it";
    return `${named(g.ts)} ${verb(g.ts, "sits", "sit")} ${g.where} ${target}`;
  });
  if (clauses.length) parts.push(`${clauses.join("; ")}.`);
  if (free.length) parts.push(`${named(free)} ${verb(free, "runs", "run")} below cost, paid for by referral fees.`);

  return {
    label: "Price per truck per month for each tier, against cost to serve, our spend estimate, the software entry tier and recovered ₹",
    summary: parts.join(" "),
    maxInr,
    ticks,
    marks: [
      { id: "cost", inr: cost, label: `Cost to serve ${formatINR(cost)}` },
      { id: "recovered", inr: recovered, label: `Recovered ${formatINR(recovered)}` },
    ],
    bands: [
      { id: "wtp", lowInr: band.lowInr, highInr: band.highInr, label: `Our spend estimate ${inrRange(band.lowInr, band.highInr)}` },
      { id: "fleetx", lowInr: fleetx.lowInr, highInr: fleetx.highInr, label: `Software entry tier ${inrRange(fleetx.lowInr, fleetx.highInr)}` },
    ],
    tiers,
  };
}

/** Where a paid price sits against a band. */
function wherePrice(priceInr: number, band: { lowInr: number; highInr: number }): "below" | "within" | "above" {
  if (priceInr < band.lowInr) return "below";
  return priceInr <= band.highInr ? "within" : "above";
}

export function getTiersView(): TiersView {
  const cost = costToServe();
  const band = wtpBand();
  const bandText = `${inrRange(band.lowInr, band.highInr)} spend estimate`;
  const fleetx = PRICE_ANCHORS.fleetxEntry;
  const fleetxText = `${inrRange(fleetx.lowInr, fleetx.highInr)} fleet-software entry tier`;
  const subsidy = freeSubsidy();

  const rows = TIERS.map((t): TierRowView => {
    const p = priceTier(t);
    return {
      id: t.id,
      name: t.name,
      price: formatINR(p.priceInr),
      unit: UNIT,
      levels: t.levelsLabel,
      autonomy: autonomyText(t.levels),
      features: t.features,
      cost: formatINR(p.costInr),
      margin: formatINR(p.marginInr),
      marginPct: p.marginPct === null ? "" : `${p.marginPct}%`,
      vsWtp: vsWtpText(p.vsWtp, bandText),
      vsFleetx: vsFleetxText(p.vsFleetx, fleetxText),
      shareOfRecoveredText: p.priceInr > 0 ? `${p.shareOfRecoveredPct}% of recovered ₹` : "",
      paidBy: t.paidBy,
      paidByText: PAID_BY[t.paidBy],
      priceClaim: t.priceClaim,
      priceStatus: status(t.priceClaim),
    };
  });

  const costRows = COST_INPUTS.map((c): CostRowView => ({
    id: c.id,
    label: c.label,
    amount: formatINR(c.inrPerTruckMonth),
    claims: c.volume ? [c.claim, c.volume] : [c.claim],
  }));

  const paid = TIERS.filter((t) => t.paidBy === "owner");
  const free = TIERS.filter((t) => t.subsidisedBy === "lending-partner");
  const names = (ts: typeof TIERS) => andList(ts.map((t) => t.name));
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
      // Free's own price claim (referral fees pay for it) sits with the payer that funds it.
      claims: [...free.map((t) => t.priceClaim), LENDING_CLAIMS.role, REFERRAL_FEE.claim],
    },
    {
      payer: "Consent basis",
      // Our planned consent flow, not a built or reviewed one: labelled as such.
      pays: "Assumption: the owner consents before any data is shared, recorded under the DPDP Act and carried by an Account Aggregator where one can carry the data, under the RBI's Digital Lending Directions, 2025",
      funds: "",
      claims: LENDING_CLAIMS.consent,
    },
  ];

  // In the order the page renders them, so the [n] numbers run 1, 2, 3… down the page. The tier
  // prices (PRICING_CLAIMS) come in through the who-pays rows.
  const claims: Claim[] = [
    NO_NEW_HARDWARE_DESIGN,
    NO_NEW_HARDWARE,
    FUEL_SENSOR_TODAY,
    PRICE_ANCHORS.currentSpend.claim,
    SPEND_LISTINGS,
    PRICE_ANCHORS.fleetxEntry.claim,
    ...costRows.flatMap((c) => c.claims),
    ...whoPays.flatMap((r) => r.claims),
    EXAMPLE_LOAN.claim,
  ];

  return {
    rows,
    table: TIER_TABLE,
    costs: { rows: costRows, total: formatINR(cost) },
    recovered: { value: formatINR(band.recovered.perTruckMonthInr), label: band.recovered.label },
    subsidy: `One ${inrLakh(subsidy.loanInr)} used-truck loan pays ${inrRange(subsidy.feeLowInr, subsidy.feeHighInr)} in referral fees, which covers ${subsidy.yearsLow}–${subsidy.yearsHigh} years of Free on that truck (${formatINR(subsidy.freeCostPerYearInr)} a year).`,
    whoPays,
    hardware: { design: NO_NEW_HARDWARE_DESIGN, line: NO_NEW_HARDWARE, today: FUEL_SENSOR_TODAY },
    anchors: [PRICE_ANCHORS.currentSpend.claim, SPEND_LISTINGS, PRICE_ANCHORS.fleetxEntry.claim],
    priceChart: priceChart(cost, band.recovered.perTruckMonthInr, band),
    subsidySteps: [
      { label: "One used-truck loan", value: inrLakh(subsidy.loanInr) },
      { label: `Referral fee at ${REFERRAL_FEE.lowPct}–${REFERRAL_FEE.highPct}%`, value: inrRange(subsidy.feeLowInr, subsidy.feeHighInr) },
      {
        label: `Years of Free on that truck, at ${formatINR(subsidy.freeCostPerYearInr)} a year`,
        value: `${subsidy.yearsLow}–${subsidy.yearsHigh} years`,
      },
    ],
    subsidyClaims: [EXAMPLE_LOAN.claim],
    claims,
    sourceIds: citedSourceIds(claims),
  };
}
