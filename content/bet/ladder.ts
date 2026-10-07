/**
 * The autonomy ladder × tiers for the flag lab (TASK-22; docs/bet/bet-spec.md §7, exact levels).
 *
 * - L1 Insight is Free; L2 Deterministic action is Munshi; L3 Corrective SOP is Pro; L4
 *   Guardrail is Autopilot; L5 Autopilot is future and on no tier.
 * - Gates are data here; lib/bet/ladder.ts applies them to a flag at a chosen stream step.
 * - Amounts are numbers. lib/bet formats them, so no rupee sign is baked into a string here.
 *
 * Pure copy: nothing here imports lib/data.
 */
import type { Claim } from "./sources";
import type { StreamLevel } from "./streams";

export type Tier = "free" | "munshi" | "pro" | "autopilot";

export const TIERS: readonly { id: Tier; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "munshi", label: "Munshi" },
  { id: "pro", label: "Pro" },
  { id: "autopilot", label: "Autopilot" },
];

export type LadderLevelId = "L1" | "L2" | "L3" | "L4" | "L5";

export interface LadderLevelDef {
  id: LadderLevelId;
  name: string;
  /** The tier that unlocks the level; null for the future level. */
  tier: Tier | null;
  summary: string;
}

export const LADDER_LEVELS: readonly LadderLevelDef[] = [
  { id: "L1", name: "Insight", tier: "free", summary: "Morning brief, flags, evidence and Ask." },
  { id: "L2", name: "Deterministic action", tier: "munshi", summary: "Ask the driver, hold the fuel card, recover from settlement." },
  { id: "L3", name: "Corrective SOP", tier: "pro", summary: "Block a pump, set a route diesel norm, a night-stop rule." },
  { id: "L4", name: "Guardrail", tier: "autopilot", summary: "Holds driver advances on its own, with a one-tap owner override." },
  { id: "L5", name: "Autopilot", tier: null, summary: "Self-closing daily settlement." },
];

// ── Gates ────────────────────────────────────────────────────────────────
/** Hold the fuel card: the flag at Likely or above. */
export const HOLD_MIN_LEVEL: StreamLevel = "likely";
/** Recover from settlement: High, or the owner confirmed the flag. */
export const RECOVER_MIN_LEVEL: StreamLevel = "high";
/** L4 auto-hold: High and at least this many independent families. */
export const GUARDRAIL_MIN_LEVEL: StreamLevel = "high";
export const GUARDRAIL_MIN_FAMILIES = 2;
/** L4 holds a driver advance above this many rupees. */
export const ADVANCE_HOLD_ABOVE_INR = 2000;

export const LADDER_CLAIMS: readonly Claim[] = [
  {
    text: "The guardrail holds driver advances above 2,000 rupees.",
    assumption: true,
    basis: "The figure bet-spec §7 sets for the guardrail; not field-tested with owners.",
  },
  {
    text: "Owners pay for actions, not dashboards, so each tier unlocks the next rung.",
    assumption: true,
    basis: "The bet-spec §7 tier table; untested by field calls (bet-spec §5).",
  },
];

// ── Copy ─────────────────────────────────────────────────────────────────
export type LadderActionId =
  | "ask-driver"
  | "hold-fuel-card"
  | "recover"
  | "block-pump"
  | "route-norm"
  | "night-stop"
  | "auto-hold-advance"
  | "self-closing-settlement";

/** Labels take their figures already formatted (lib/bet formats every amount). */
export const ACTION_COPY = {
  askDriver: {
    label: "Ask the driver",
    reason: {
      "not-asked": "Uses the driver's side on the flag card. Not asked yet.",
      replied: "Uses the driver's side on the flag card. The driver has replied.",
      cleared: "Uses the driver's side on the flag card. The driver's reply cleared it.",
      confirmed: "Uses the driver's side on the flag card. The driver agreed.",
    },
  },
  holdFuelCard: {
    label: "Hold the fuel card",
    ok: "The flag is Likely or above, so holding the card until the driver answers is fair.",
    gate: "the flag at Likely or above; at Check, ask first",
  },
  recover: {
    label: (amount: string) => `Recover ${amount} from settlement`,
    labelDone: "Recover from settlement",
    okHigh: "The flag is High, so the amount can come off the next settlement.",
    okConfirmed: "You confirmed the flag, so the amount can come off the next settlement.",
    gate: "High confidence or your confirmation before money moves",
    already: (amount: string) => ` ${amount} already recovered.`,
    done: (amount: string) => `Already recovered in full: ${amount}.`,
  },
  blockPump: {
    label: (pump: string) => `Block ${pump} for the fleet's fuel cards`,
    ok: "Stops fills at the pump where the bill and the tank didn't add up.",
  },
  routeNorm: {
    label: (litres: number, route: string) => `Set the ${route} diesel norm at ${litres} L`,
    ok: "From this truck's normal on the route; a trip over it is flagged the day it ends.",
  },
  nightStop: {
    label: (stretch: string) => `No unplanned night stops on the ${stretch}`,
    ok: "Where this drop happened; at night the driver stops only at a listed yard.",
  },
  autoHold: {
    label: (amount: string) => `Auto-hold driver advances above ${amount}`,
    ok: (families: number) => `High, and ${families} independent families agree. The owner can override in one tap.`,
    gate: (level: string, families: number) =>
      `High and at least ${GUARDRAIL_MIN_FAMILIES} independent families; this step has ${level} on ${families} ${families === 1 ? "family" : "families"}`,
  },
  settlement: { label: "Self-closing daily settlement", reason: "Future, not building now." },
  needsTier: (tier: string) => `Needs the ${tier} tier`,
  needs: "Needs",
  wrong: "You marked this flag wrong and accepted the driver's side.",
  resolved: "Resolved: you confirmed this flag.",
  noSop: "No corrective SOP for this rule yet.",
} as const;
