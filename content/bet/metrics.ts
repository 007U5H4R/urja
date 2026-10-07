/**
 * The metrics for /bet (TASK-28; docs/bet/bet-spec.md §9, frozen): the North Star, the primary
 * metrics and the guardrails, with the EXE47 targets as labelled assumptions. The North Star's
 * definition is the verified ledger's own (bet-spec §8, content/bet/trust.ts), so the overview and
 * the lender view can't drift apart.
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

/** A target we chose: an assumption, never a measurement. */
export type Target = Extract<Claim, { assumption: true }>;

/** EXE47: the one set of metric targets (the strategy doc's), each to calibrate in the pilot. */
export const TARGET_BASIS = "Our target; to calibrate in the pilot (EXE47)";

const target = (text: string): Target => ({ text, assumption: true, basis: TARGET_BASIS });

export interface PrimaryMetric {
  name: string;
  /** The EXE47 target; null where none is set. */
  target: Target | null;
}

export const PRIMARY_METRICS: readonly PrimaryMetric[] = [
  { name: "% of mornings the brief is opened", target: null },
  { name: "% of flags acted on within 24 h", target: target("50% or more") },
  { name: "₹ recovered per truck per month", target: null },
  { name: "Daily-close completion rate", target: target("On 25 or more days a month") },
  { name: "Free → Munshi conversion", target: target("10% within 90 days") },
  { name: "Loan-ready trucks and loans referred", target: null },
];

export interface Guardrail {
  name: string;
  /** bet-spec §9's line (METRICS_COPY.claim labels these as targets); null where it sets none. */
  threshold: string | null;
  /** The EXE47 target where bet-spec §9 set no line; null otherwise. */
  target: Target | null;
}

export const GUARDRAILS: readonly Guardrail[] = [
  { name: "Wrong-flag rate (driver disputes accepted as innocent)", threshold: "Under 10%", target: null },
  { name: "Driver 90-day retention", threshold: null, target: null },
  { name: "Owner churn", threshold: null, target: target("Under 3% a month") },
  { name: "Ask answer accuracy", threshold: "Eval ≥ 9/10 by the model", target: null },
  { name: "Consent revocations", threshold: null, target: target("Under 2% a month") },
  { name: "Cost to serve", threshold: "Under ₹100 per truck per month", target: null },
];

/** Every EXE47 target, in page order (primary metrics, then guardrails). */
export const metricTargets = (): Target[] =>
  [...PRIMARY_METRICS, ...GUARDRAILS].flatMap((m) => (m.target ? [m.target] : []));

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
