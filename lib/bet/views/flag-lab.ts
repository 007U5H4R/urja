/**
 * The flag-lab view model (TASK-22): a flagged trip's flags with their stream ladder and the
 * action ladder at every step × tier, so a client component holds only `{ stepIndex, tier }`.
 *
 * - null for a clean trip, a trip still on the road, or an unknown id.
 * - `defaultStep` is the last real step, so the lab opens on the FlagCard's confidence.
 * - "Independent families" are source systems, not stream kinds (EXE43): each step names its
 *   `source`, says whether it `counts`, and `familiesNote` explains the count. No step carries
 *   the spec's §6 family column, so the UI can't set four "family" labels beside "1 family".
 * - The levels' static fields go once in `levels`; `matrix[step][tier]` holds only what changes.
 * - Every display string is formatted here (₹ through lib/format).
 */
import { TIERS, type Tier } from "@/content/bet/ladder";
import {
  FAMILIES_NOTE,
  NOT_COUNTED_NOTE,
  STREAM_LADDERS,
  STREAMS,
  SYSTEM_LABEL,
  type StreamId,
  type StreamLevel,
} from "@/content/bet/streams";
import { flagsForTrip } from "@/lib/data/aggregates";
import { CONFIDENCE_WORD } from "@/lib/data/rules/confidence";
import type { FlagStatus, RuleId, TripId } from "@/lib/data/types";
import { formatINR } from "@/lib/format";
import { defaultStepIndex, familiesAt, fuseSteps, STREAM_OF } from "../fusion";
import { LADDER_LEVEL_META, ladderFor, type LadderLevelCell, type LadderLevelMeta } from "../ladder";

export interface FlagLabStepView {
  index: number;
  streamId: StreamId;
  label: string;
  /** Where the reading comes from ("The truck's tracker"); steps sharing a source are one family. */
  source: string;
  /** Whether this step backs the flag and so counts towards independent families. */
  counts: boolean;
  /** Why a step doesn't count (the typed claim, or a stream arguing against the flag); null when it counts. */
  countNote: string | null;
  simulated: boolean;
  /** "Simulated" on a simulated stream, else null. */
  simulatedTag: string | null;
  level: StreamLevel;
  levelWord: string;
  note: string;
  /** Independent families agreeing by this step. */
  families: number;
  /** "2 independent families", or "No independent family yet". */
  familiesText: string;
  /** The flag's own evidence lines from this stream (none for a simulated one). */
  evidence: string[];
}

export interface FlagLabFlagView {
  id: string;
  rule: RuleId;
  ruleName: string;
  confidence: StreamLevel;
  confidenceWord: string;
  status: FlagStatus;
  inr: number;
  inrText: string;
  steps: FlagLabStepView[];
  defaultStep: number;
  /** matrix[stepIndex][tier][k]: level `levels[k]`'s per-flag fields at that step on that tier. */
  matrix: Record<Tier, LadderLevelCell[]>[];
}

export interface FlagLabView {
  tripId: TripId;
  tiers: readonly { id: Tier; label: string }[];
  /** The five ladder levels' static fields, in order; matrix cells line up with them. */
  levels: LadderLevelMeta[];
  /** What "independent families" counts. */
  familiesNote: string;
  flags: FlagLabFlagView[];
}

const SIMULATED_TAG = "Simulated";

const familiesText = (n: number) =>
  n === 0 ? "No independent family yet" : `${n} independent ${n === 1 ? "family" : "families"}`;

/** Why a step doesn't count: it is the claim under test, or it argues against this flag. */
function countNote(streamId: StreamId, rule: RuleId, corroborates: boolean): string | null {
  if (corroborates) return null;
  if (!STREAMS[streamId].corroborates) return NOT_COUNTED_NOTE;
  const def = STREAM_LADDERS[rule].steps.find((d) => d.stream === streamId);
  return def?.againstNote ?? null;
}

/** The flag lab for a finished, flagged trip; null otherwise. */
export function getFlagLabView(tripId: string): FlagLabView | null {
  const flags = flagsForTrip(tripId);
  if (flags.length === 0) return null;
  return {
    tripId,
    tiers: TIERS,
    levels: LADDER_LEVEL_META.map((m) => ({ ...m })),
    familiesNote: FAMILIES_NOTE,
    flags: flags.map((flag) => {
      const steps = fuseSteps(flag);
      return {
        id: flag.id,
        rule: flag.rule,
        ruleName: STREAM_LADDERS[flag.rule].ruleName,
        confidence: flag.confidence,
        confidenceWord: CONFIDENCE_WORD[flag.confidence].en,
        status: flag.status,
        inr: flag.inr,
        inrText: formatINR(flag.inr),
        steps: steps.map((s, i) => {
          const families = familiesAt(steps, i);
          return {
            index: i,
            streamId: s.streamId,
            label: s.label,
            source: SYSTEM_LABEL[s.system],
            counts: s.corroborates,
            countNote: countNote(s.streamId, flag.rule, s.corroborates),
            simulated: s.simulated,
            simulatedTag: s.simulated ? SIMULATED_TAG : null,
            level: s.level,
            levelWord: CONFIDENCE_WORD[s.level].en,
            note: s.note,
            families,
            familiesText: familiesText(families),
            evidence: s.simulated ? [] : flag.evidence.filter((e) => STREAM_OF[e.source] === s.streamId).map((e) => e.text.en),
          };
        }),
        defaultStep: defaultStepIndex(steps),
        matrix: steps.map(
          (_, i) =>
            Object.fromEntries(
              TIERS.map((t) => [t.id, ladderFor(flag, i, t.id).map(({ unlocked, note, actions }) => ({ unlocked, note, actions }))]),
            ) as Record<Tier, LadderLevelCell[]>,
        ),
      };
    }),
  };
}
