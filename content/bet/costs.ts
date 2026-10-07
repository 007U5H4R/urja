/**
 * Cost to serve one truck for a month, and the lending-partnership inputs that pay for Free
 * (TASK-24; docs/bet/bet-spec.md §7, frozen). Each input is cited or labelled an assumption with
 * its basis; lib/bet/pricing.ts adds them up (≈ ₹78) and works out the Free subsidy.
 */
import type { Claim } from "./sources";

export interface CostInput {
  id: "whatsapp" | "llm" | "ingestion" | "ocr" | "support";
  label: string;
  /** ₹ per truck per month. */
  inrPerTruckMonth: number;
  claim: Claim;
}

/** The WhatsApp line: about 30 utility messages a month at ₹0.145 each (₹4.35, counted as ₹4). */
export const WHATSAPP_DERIVATION = { messages: 30, unitInr: 0.145 } as const;

export const COST_INPUTS: readonly CostInput[] = [
  {
    id: "whatsapp",
    label: "WhatsApp utility messages (~30 a month)",
    inrPerTruckMonth: 4,
    claim: {
      text: "A WhatsApp utility message costs ₹0.145 outside the service window; about 30 a month come to ₹4 per truck.",
      sourceIds: ["whatsapp-pricing"],
    },
  },
  {
    id: "llm",
    label: "LLM (Gemini Flash, ~40 answers)",
    inrPerTruckMonth: 15,
    claim: {
      text: "The LLM costs about ₹15 per truck a month.",
      assumption: true,
      basis: "About 40 Gemini Flash answers per truck a month, briefs included (bet-spec §7).",
    },
  },
  {
    id: "ingestion",
    label: "Ingestion, storage and compute",
    inrPerTruckMonth: 25,
    claim: {
      text: "Ingesting, storing and reconciling one truck's telemetry, tolls and bills costs about ₹25 a month.",
      assumption: true,
      basis: "Our estimate for one truck's telemetry, FASTag and e-way-bill streams on commodity cloud (bet-spec §7).",
    },
  },
  {
    id: "ocr",
    label: "Bill OCR (~20 bills)",
    inrPerTruckMonth: 4,
    claim: {
      text: "Reading about 20 bills a month costs about ₹4 per truck.",
      assumption: true,
      basis: "About 20 fuel and toll bills per truck a month at per-page OCR rates (bet-spec §7).",
    },
  },
  {
    id: "support",
    label: "Support, amortised",
    inrPerTruckMonth: 30,
    claim: {
      text: "Support costs about ₹30 per truck a month.",
      assumption: true,
      basis: "Hindi phone and WhatsApp support amortised across a small fleet's trucks (bet-spec §7).",
    },
  },
];

/** An example used-truck loan, for the Free subsidy. */
export const EXAMPLE_LOAN: { amountInr: number; claim: Claim } = {
  amountInr: 1_000_000,
  claim: {
    text: "An example used-truck loan of ₹10 lakh.",
    assumption: true,
    basis: "An illustrative ticket size for a used truck bought by a small owner (bet-spec §7).",
  },
};

/** The referral fee a lending partner pays per funded loan, as a % of the loan. */
export const REFERRAL_FEE: { lowPct: number; highPct: number; claim: Claim } = {
  lowPct: 0.5,
  highPct: 1.5,
  claim: {
    text: "A lending partner pays a referral fee of 0.5–1.5% of each funded loan.",
    assumption: true,
    basis: "DSA payout ranges vary and are unverified (bet-spec §7).",
  },
};

/** The referral role, and the consent the owner gives before anything is shared. */
export const LENDING_CLAIMS: { role: Claim; consent: readonly Claim[] } = {
  role: {
    text: "A referral or lending-service partner is a regulated role under the RBI's Digital Lending Directions, 2025.",
    sourceIds: ["rbi-digital-lending"],
  },
  consent: [
    {
      text: "Account Aggregator consent works at scale: 28.9 crore consents fulfilled by 31 July 2025, and ₹1.67 lakh crore lent through AA in FY25.",
      sourceIds: ["aa-consents-sahamati", "aa-fy25"],
    },
    {
      text: "The RBI's Digital Lending Directions, 2025, dated 8 May 2025, replaced the 2022 digital-lending guidelines.",
      sourceIds: ["rbi-digital-lending"],
    },
    {
      text: "The DPDP Rules, 2025 were notified in Nov 2025: consent-manager registration starts 12 months later, and most of the other Rules 18 months later.",
      sourceIds: ["dpdp-rules-2025"],
    },
    {
      text: "Under the draft DPDP Rules, Account Aggregators may act as 'white-label' consent managers.",
      sourceIds: ["aa-consent-manager"],
    },
    {
      text: "SuprFleet would share an owner's ledger with a lender only after the owner consents, would record that consent under the DPDP Act, 2023, and would use an Account Aggregator where one can carry the data.",
      assumption: true,
      basis: "Our design for the consent flow in the first NBFC lending partnership (bet-spec §10: consent flow, AA/DPDP); not built, and not yet reviewed by counsel.",
    },
  ],
};
