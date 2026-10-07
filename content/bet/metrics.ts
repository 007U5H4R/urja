/**
 * The metrics for /bet (TASK-28; docs/bet/bet-spec.md §9, frozen): the North Star, the primary
 * metrics and the guardrails. The North Star's definition is the verified ledger's own (bet-spec
 * §8, content/bet/trust.ts), so the overview and the lender view can't drift apart.
 * Pure copy: nothing here imports lib/data.
 */
import type { Claim } from "./sources";
import { VERIFIED_DAY, VERIFIED_MONTH } from "./trust";

export const NORTH_STAR = {
  label: "North Star",
  name: "Verified truck-months",
  why: "It ties owner value (closed books) to the asset a lender trusts.",
  /** The definition: a verified truck-month, then a verified day (our definitions, labelled). */
  definition: [VERIFIED_MONTH.claim, VERIFIED_DAY.claim] as readonly Claim[],
} as const;

export const PRIMARY_METRICS: readonly string[] = [
  "% of mornings the brief is opened",
  "% of flags acted on within 24 h",
  "₹ recovered per truck per month",
  "Daily-close completion rate",
  "Free → Munshi conversion",
  "Loan-ready trucks and loans referred",
];

export interface Guardrail {
  name: string;
  /** The line we hold it to; null where bet-spec sets none. */
  threshold: string | null;
}

export const GUARDRAILS: readonly Guardrail[] = [
  { name: "Wrong-flag rate (driver disputes accepted as innocent)", threshold: "Under 10%" },
  { name: "Driver 90-day retention", threshold: null },
  { name: "Owner churn", threshold: null },
  { name: "Ask answer accuracy", threshold: "Eval ≥ 9/10 by the model" },
  { name: "Consent revocations", threshold: null },
  { name: "Cost to serve", threshold: "Under ₹100 per truck per month" },
];

export const METRICS_COPY = {
  primaryHeading: "Primary metrics",
  guardrailHeading: "Guardrails",
  noThreshold: "Tracked; no line set yet",
  claim: {
    text: "The guardrail lines are our targets, not measurements.",
    assumption: true,
    basis: "bet-spec §9. No pilot has run yet, so each line is what we would hold the pilots to.",
  } satisfies Claim,
} as const;
