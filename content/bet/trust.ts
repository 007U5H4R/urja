/**
 * The verified ledger and trust score for the truck lender view (TASK-23; bet-spec §8, frozen).
 * Every number here is an assumption we chose and will defend as one, so each carries a `Claim`
 * with its basis. lib/bet/trust.ts turns these into per-truck factors (0–1) and a score (0–100);
 * lib/bet/views/truck.ts formats them for /trucks/[plate]. Pure copy: no lib/data import.
 */
import type { CitedClaim, Claim } from "./sources";

export type TrustFactorId = "completeness" | "resolution" | "leakage" | "stability" | "utilisation";

export interface TrustFactorDef {
  id: TrustFactorId;
  /** The short label on the score breakdown. */
  label: string;
  /** Points out of 100. */
  weight: number;
  /** How the factor is measured from the ledger, in one line. */
  measure: string;
  claim: Claim;
}

const WEIGHTS_BASIS =
  "Our weighting (bet-spec §8): the record a lender reads must first be complete and settled, then show low leakage, steady earnings and a truck that runs. To be tuned with a lending partner.";

/** bet-spec §8: the five factors and their weights (sum 100). */
export const TRUST_FACTORS: readonly TrustFactorDef[] = [
  {
    id: "completeness",
    label: "Data completeness",
    weight: 30,
    measure: "Share of trip-minutes without a GPS gap over 5 min",
    claim: { text: "Data completeness weighs 30 of 100.", assumption: true, basis: WEIGHTS_BASIS },
  },
  {
    id: "resolution",
    label: "Flags resolved within 48 h",
    weight: 25,
    measure: "Share of flags not left waiting for more than 48 h",
    claim: { text: "Flag resolution within 48 h weighs 25 of 100.", assumption: true, basis: WEIGHTS_BASIS },
  },
  {
    id: "leakage",
    label: "Low leakage",
    weight: 20,
    measure: "Unaccounted diesel ₹ as a share of diesel ₹ (lower is better)",
    claim: { text: "Leakage as a share of diesel ₹ weighs 20 of 100; lower scores higher.", assumption: true, basis: WEIGHTS_BASIS },
  },
  {
    id: "stability",
    label: "Steady weekly profit",
    weight: 15,
    measure: "Variation of profit per day across the weeks of the month",
    claim: { text: "Weekly profit stability weighs 15 of 100.", assumption: true, basis: WEIGHTS_BASIS },
  },
  {
    id: "utilisation",
    label: "Utilisation",
    weight: 10,
    measure: "Share of days the truck spent on a trip",
    claim: { text: "Utilisation weighs 10 of 100.", assumption: true, basis: WEIGHTS_BASIS },
  },
];

/** A trip-minute counts as covered unless it sits in a GPS gap longer than this. */
export const GPS_GAP_MIN = 5;

/**
 * Leakage at or above this share of diesel ₹ scores 0; 0% scores 1, linear between. The zero
 * point is our assumption; the ~8% it sits just above is cited in `benchmark`.
 */
export const LEAKAGE_ZERO_AT_SHARE = {
  share: 0.1,
  claim: {
    text: "Unaccounted diesel at 10% or more of diesel ₹ scores zero on leakage.",
    assumption: true,
    basis:
      "Leakage is often cited at about 8% of diesel (a soft, unverified figure). We set zero a little above that, at 10%, so only a truck losing more than the commonly cited level earns nothing on this factor.",
  } satisfies Claim,
  benchmark: {
    text: "Diesel leakage is often cited at about 8% of the diesel filled.",
    sourceIds: ["fuel-leakage-8pct"],
  } satisfies CitedClaim,
};

/**
 * Weekly profit per day with a coefficient of variation at or above this scores 0; equal weeks
 * score 1, linear between.
 */
export const STABILITY_ZERO_AT_CV = {
  cv: 1.5,
  claim: {
    text: "Weekly profit per day that varies by 1.5 times its mean or more scores zero on stability.",
    assumption: true,
    basis:
      "Our threshold: a trip's profit lands on the day it ends, so a small truck's weeks are lumpy (in the simulated September the 24 trucks run from 0.1 to 1.2). At 1.5 a weekly instalment would often go unmet.",
  } satisfies Claim,
};

/** bet-spec §8: a verified day. */
export const VERIFIED_DAY = {
  resolveWithinH: 48,
  definition: "The books closed, every trip reconciled, and no unresolved flag older than 48 h.",
  claim: {
    text: "A verified day: the books closed, every trip reconciled, and no unresolved flag older than 48 h.",
    assumption: true,
    basis: "Our definition (bet-spec §8): a day a lender can rely on has a closed ledger and no open question older than two days.",
  } satisfies Claim,
};

/** bet-spec §8: a verified truck-month. */
export const VERIFIED_MONTH = {
  minDays: 25,
  claim: {
    text: "A verified truck-month has at least 25 verified days.",
    assumption: true,
    basis: "Our definition (bet-spec §8): allows a few days off the road or awaiting resolution in a 30-day month.",
  } satisfies Claim,
};

/** bet-spec §8: the score stays provisional until this many verified days. */
export const VERIFIED_DAYS_TARGET = {
  days: 180,
  claim: {
    text: "The trust score is provisional until 180 verified days.",
    assumption: true,
    basis: "Our threshold (bet-spec §8): about six months of history, so a lender sees more than one season of loads.",
  } satisfies Claim,
};

/** The loan-readiness lines on the truck page. Illustrative only; SuprFleet does not lend. */
export const LOAN_ASSUMPTIONS = {
  emiHeadroom: {
    share: 0.4,
    claim: {
      text: "40% of the verified surplus counts as EMI headroom.",
      assumption: true,
      basis:
        "Our assumption, not yet sourced: a cautious share of the trip surplus, because the surplus leaves out salary, upkeep and existing EMIs. To be set with a lending partner.",
    } satisfies Claim,
  },
  tenor: {
    months: 48,
    claim: {
      text: "Illustrative tenor: 48 months.",
      assumption: true,
      basis: "Our assumption, not yet sourced: a mid-length illustrative tenor for a used commercial-vehicle loan. To be set with a lending partner.",
    } satisfies Claim,
  },
};

/** The consent step before anything reaches a lender (bet-spec §1, §7, §10): our design, not built. */
export const LOAN_CONSENT: Claim = {
  text: "SuprFleet would share a truck's record with a lending partner only after the owner consents, through a consent flow modelled on the Account Aggregator framework and the DPDP Act's consent rules.",
  assumption: true,
  basis:
    "Our design for the consent flow (bet-spec §1, §7, §10: a consented lending partnership, with an AA/DPDP consent flow on the roadmap); not built, not reviewed by counsel.",
};

/** The partnership framing (bet-spec §7): our model, not a signed arrangement. */
export const LOAN_PARTNERSHIP: Claim = {
  text: "SuprFleet would refer the owner to a lending partner; the partner would underwrite and lend.",
  assumption: true,
  basis:
    "Our model (bet-spec §7: a referral or lending-service partner, paid a referral fee per funded loan); no lending partner is signed, and the regulatory fit is not reviewed by counsel.",
};

/** Only what the sources themselves say about the rails the consent step would use. */
export const LOAN_CONTEXT: readonly CitedClaim[] = [
  { text: "₹1.67 lakh crore of loans was disbursed via Account Aggregator in FY25.", sourceIds: ["aa-fy25"] },
  { text: "RBI's Digital Lending Directions, 2025 (8 May 2025) replaced its 2022 digital-lending guidelines.", sourceIds: ["rbi-digital-lending"] },
];
