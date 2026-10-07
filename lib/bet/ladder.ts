/**
 * The action ladder for a flag at a chosen stream step and tier (TASK-22; bet-spec §7).
 *
 * Each action gets one state and a plain-English reason:
 * - `closed`: nothing to do (the flag was marked wrong, already resolved, or recovered in full);
 * - `needs-tier`: the chosen tier is below the level's tier (the reason also names any unmet gate);
 * - `needs-confidence`: the step's level or its independent families don't meet the gate;
 * - `available`; and `future` for L5.
 *
 * Gates read the chosen step, not the flag's final confidence, so moving the stream slider moves
 * them: Hold needs ≥ Likely, Recover needs High (or a confirmed flag), and the L4 guardrail needs
 * High on at least two independent families. Amounts are numbers (`amountInr`); labels carry
 * them formatted with lib/format.
 */
import {
  ACTION_COPY as C,
  ADVANCE_HOLD_ABOVE_INR,
  GUARDRAIL_MIN_FAMILIES,
  GUARDRAIL_MIN_LEVEL,
  HOLD_MIN_LEVEL,
  LADDER_LEVELS,
  RECOVER_MIN_LEVEL,
  TIERS,
  type LadderActionId,
  type LadderLevelDef,
  type LadderLevelId,
  type Tier,
} from "@/content/bet/ladder";
import type { StreamLevel } from "@/content/bet/streams";
import { tripById, type ReadonlyFlag } from "@/lib/data";
import { baselineClFor, truckByPlate } from "@/lib/data/fleet";
import { placeById } from "@/lib/data/places";
import { routeName, STRETCHES } from "@/lib/data/routes";
import { CONFIDENCE_WORD } from "@/lib/data/rules/confidence";
import type { RuleId } from "@/lib/data/types";
import { formatINR } from "@/lib/format";
import { atLeast, familiesAt, fuseSteps } from "./fusion";

export type ActionState = "available" | "needs-confidence" | "needs-tier" | "closed" | "future";

export interface LadderActionView {
  id: LadderActionId;
  label: string;
  state: ActionState;
  reason: string;
  /** The rupees the action moves or guards, for the Money component. */
  amountInr?: number;
}

/** A level's fields that are the same for every flag, step and tier. */
export interface LadderLevelMeta {
  id: LadderLevelId;
  name: string;
  /** "L2 Deterministic action". */
  title: string;
  tier: Tier | null;
  tierLabel: string;
  summary: string;
}

/** A level's fields for one flag at one step on one tier. */
export interface LadderLevelCell {
  /** Whether the chosen tier includes this level. */
  unlocked: boolean;
  /** Shown when the level has no action for this flag. */
  note: string | null;
  actions: LadderActionView[];
}

export type LadderLevelView = LadderLevelMeta & LadderLevelCell;

const TIER_RANK: Record<Tier, number> = { free: 0, munshi: 1, pro: 2, autopilot: 3 };
const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.id, t.label])) as Record<Tier, string>;
/** The rules whose rupees are diesel, so a route diesel norm is the SOP. */
const DIESEL_NORM_RULES: readonly RuleId[] = ["R1", "R2", "R3", "R4"];

const inr = (n: number) => formatINR(n, { sign: "never" });

/** What an action would be if tier and gate allowed it. */
interface Candidate {
  id: LadderActionId;
  label: string;
  /** Set when there is nothing to do, whatever the tier. */
  closed?: string;
  /** The unmet gate ("High confidence or …"), or null when the gate is met. */
  gate: string | null;
  ok: string;
  amountInr?: number;
}

function resolve(c: Candidate, def: LadderLevelDef, tier: Tier): LadderActionView {
  const base = { id: c.id, label: c.label, ...(c.amountInr !== undefined ? { amountInr: c.amountInr } : {}) };
  if (c.closed) return { ...base, state: "closed", reason: c.closed };
  if (def.tier && TIER_RANK[tier] < TIER_RANK[def.tier]) {
    const need = C.needsTier(TIER_LABEL[def.tier]);
    return { ...base, state: "needs-tier", reason: c.gate ? `${need}, and ${c.gate}.` : `${need}.` };
  }
  if (c.gate) return { ...base, state: "needs-confidence", reason: `${C.needs} ${c.gate}.` };
  return { ...base, state: "available", reason: c.ok };
}

function l2(flag: ReadonlyFlag, level: StreamLevel): Candidate[] {
  const wrong = flag.status === "wrong" ? C.wrong : undefined;
  const resolved = wrong ?? (flag.status === "confirmed" ? C.resolved : undefined);
  const left = flag.inr - flag.recoveredInr;
  const confirmed = flag.status === "confirmed";
  const recoverOk = atLeast(level, RECOVER_MIN_LEVEL) || confirmed;
  const already = flag.recoveredInr > 0 ? C.recover.already(inr(flag.recoveredInr)) : "";
  return [
    { id: "ask-driver", label: C.askDriver.label, closed: resolved, gate: null, ok: C.askDriver.reason[flag.driverSide.state] },
    {
      id: "hold-fuel-card",
      label: C.holdFuelCard.label,
      closed: resolved,
      gate: atLeast(level, HOLD_MIN_LEVEL) ? null : C.holdFuelCard.gate,
      ok: C.holdFuelCard.ok,
    },
    {
      id: "recover",
      label: left > 0 ? C.recover.label(inr(left)) : C.recover.labelDone,
      closed: wrong ?? (left <= 0 ? C.recover.done(inr(flag.recoveredInr)) : undefined),
      gate: recoverOk ? null : C.recover.gate,
      ok: (confirmed ? C.recover.okConfirmed : C.recover.okHigh) + already,
      ...(left > 0 ? { amountInr: left } : {}),
    },
  ];
}

function l3(flag: ReadonlyFlag): Candidate[] {
  const closed = flag.status === "wrong" ? C.wrong : undefined;
  const out: Candidate[] = [];
  const place = flag.placeId ? placeById(flag.placeId) : null;
  if (flag.rule === "R2" && place?.kind === "pump") {
    out.push({ id: "block-pump", label: C.blockPump.label(place.name.en), closed, gate: null, ok: C.blockPump.ok });
  }
  if (DIESEL_NORM_RULES.includes(flag.rule)) {
    const trip = tripById(flag.tripId);
    const litres = Math.round(baselineClFor(truckByPlate(flag.plate), trip.routeId) / 100);
    out.push({ id: "route-norm", label: C.routeNorm.label(litres, routeName(trip.routeId).en), closed, gate: null, ok: C.routeNorm.ok });
  }
  if (flag.rule === "R1" && place) {
    const stretch = Object.values(STRETCHES).find((s) => s.centerPlaceId === place.id);
    const name = stretch ? stretch.name.en : `stretch near ${place.name.en}`;
    out.push({ id: "night-stop", label: C.nightStop.label(name), closed, gate: null, ok: C.nightStop.ok });
  }
  return out;
}

function l4(flag: ReadonlyFlag, level: StreamLevel, families: number): Candidate[] {
  const met = atLeast(level, GUARDRAIL_MIN_LEVEL) && families >= GUARDRAIL_MIN_FAMILIES;
  return [
    {
      id: "auto-hold-advance",
      label: C.autoHold.label(inr(ADVANCE_HOLD_ABOVE_INR)),
      closed: flag.status === "wrong" ? C.wrong : undefined,
      gate: met ? null : C.autoHold.gate(CONFIDENCE_WORD[level].en, families),
      ok: C.autoHold.ok(families),
      amountInr: ADVANCE_HOLD_ABOVE_INR,
    },
  ];
}

/** The five levels' static fields, in ladder order. */
export const LADDER_LEVEL_META: readonly LadderLevelMeta[] = LADDER_LEVELS.map((def) => ({
  id: def.id,
  name: def.name,
  title: `${def.id} ${def.name}`,
  tier: def.tier,
  tierLabel: def.tier ? TIER_LABEL[def.tier] : "Future",
  summary: def.summary,
}));

/** The five levels for `flag` at stream step `step` (an index into fuseSteps(flag)) on `tier`. */
export function ladderFor(flag: ReadonlyFlag, step: number, tier: Tier): LadderLevelView[] {
  const steps = fuseSteps(flag);
  if (!Number.isInteger(step) || step < 0 || step >= steps.length) {
    throw new RangeError(`Step ${step} is outside ${flag.id}'s ladder of ${steps.length}`);
  }
  const level = steps[step].level;
  const families = familiesAt(steps, step);
  return LADDER_LEVELS.map((def, k) => {
    let actions: LadderActionView[];
    if (def.id === "L5") actions = [{ id: "self-closing-settlement", label: C.settlement.label, state: "future", reason: C.settlement.reason }];
    else {
      const candidates = def.id === "L2" ? l2(flag, level) : def.id === "L3" ? l3(flag) : def.id === "L4" ? l4(flag, level, families) : [];
      actions = candidates.map((c) => resolve(c, def, tier));
    }
    return {
      ...LADDER_LEVEL_META[k],
      unlocked: def.tier !== null && TIER_RANK[tier] >= TIER_RANK[def.tier],
      note: def.id === "L3" && actions.length === 0 ? C.noSop : null,
      actions,
    };
  });
}
