/**
 * Stream fusion for the flag lab (TASK-22; docs/bet/bet-spec.md §6).
 *
 * The rules keep only a flag's final confidence, not the margin, GPS-gap and noise inputs
 * behind it, so fusion cannot re-run `grade()`. It is a deterministic level model instead:
 *
 * - Each rule has a ladder of streams (content/bet/streams.ts); each step names the level the
 *   evidence so far can reach on its own.
 * - A real step's level is that, lowered to the flag's own confidence. The last real step of
 *   every ladder reaches the rule's ceiling (High, or Likely for R2's bill cap), so it always
 *   lands exactly on `flag.confidence`: the invariant lib/bet/fusion.test.ts holds on every flag.
 * - A simulated step never invents margin. Bill OCR lifts R2's hand-typed cap only when the cap
 *   was all that held the flag (it sits at the cap, Likely); a camera keeps the level and adds
 *   an independent family. Nothing lifts R3's heavy-load cap.
 * - The OCR lift relies on one fact about the data: every R2 flag sitting at the cap clears High
 *   on its own numbers once the cap is gone. fusion.test.ts re-runs the uncapped grade() on each
 *   such flag; if a new R2 flag broke that, the test fails rather than the lab overclaiming.
 * - Independent families (familiesAt) count distinct source systems among the steps that back
 *   the flag: not the typed bill (the claim itself), and not a step that argues against the flag
 *   (R3's e-way bill under the heavy-load cap).
 *
 * Pure and deterministic: it reads the frozen dataset and never changes a flag.
 */
import { STREAM_LADDERS, STREAMS, type HeldReason, type StreamId, type StreamLevel, type StreamSystem } from "@/content/bet/streams";
import { tripById, type ReadonlyFlag } from "@/lib/data";
import { truckByPlate } from "@/lib/data/fleet";
import { CONFIDENCE_WORD } from "@/lib/data/rules/confidence";
import type { Evidence } from "@/lib/data/types";

export interface StreamStep {
  streamId: StreamId;
  label: string;
  /** The source system; steps from one system count as one independent family. */
  system: StreamSystem;
  simulated: boolean;
  /** Whether this step backs the flag here: false for the claim under test and for a stream that argues against it. */
  corroborates: boolean;
  /** The level once this stream joins the ones before it. */
  level: StreamLevel;
  note: string;
}

export const RANK: Readonly<Record<StreamLevel, number>> = { check: 0, likely: 1, high: 2 };
/** The lower of two levels. */
export const lower = (a: StreamLevel, b: StreamLevel): StreamLevel => (RANK[a] <= RANK[b] ? a : b);
/** Whether `level` meets the gate `min`. */
export const atLeast = (level: StreamLevel, min: StreamLevel) => RANK[level] >= RANK[min];

/** Which stream a flag's evidence line comes from (the dataset's trip plan stands in for the e-way bill). */
export const STREAM_OF: Readonly<Record<Evidence["source"], StreamId>> = {
  "Fuel sensor": "can-fuel",
  "GPS · ignition": "gps-ignition",
  Geofence: "geofence",
  "Fleet history": "fleet-history",
  "Fuel bill": "fuel-bill-typed",
  FASTag: "fastag",
  "Trip plan": "eway-bill",
};

/** R2's cap (technical-plan §4.4): a typed bill holds the flag at Likely. */
const BILL_CAP: StreamLevel = "likely";

/** Why a flag sits below what its streams reach: R3's heavy-load cap, else its own margin. */
function heldReason(flag: ReadonlyFlag): HeldReason {
  if (flag.rule !== "R3") return "margin";
  const trip = tripById(flag.tripId);
  const usual = truckByPlate(flag.plate).usualLoadT[trip.routeId];
  return usual !== undefined && trip.loadT > usual ? "load-cap" : "margin";
}

/** The flag's own reason, without the rule's lead-in ("Check: ", "Capped at Likely: "). */
const ownWhy = (flag: ReadonlyFlag) => flag.whyConfidence.en.replace(/^(Check|Capped at Likely): /, "");

/** The cumulative stream ladder for a flag: each step adds one stream to the ones before it. */
export function fuseSteps(flag: ReadonlyFlag): StreamStep[] {
  const ladder = STREAM_LADDERS[flag.rule];
  const final = flag.confidence;
  const reason = heldReason(flag);
  const steps: StreamStep[] = [];
  let lastReal: StreamLevel = "check";
  let heldBefore = false;
  for (const def of ladder.steps) {
    const stream = STREAMS[def.stream];
    let level: StreamLevel;
    if (!stream.simulated) {
      level = lower(def.reaches, final);
      lastReal = level;
    } else if (def.lifts === "bill-cap" && flag.rule === "R2" && lastReal === BILL_CAP) {
      level = def.reaches;
    } else {
      level = lower(def.reaches, lastReal);
    }
    const held = RANK[level] < RANK[def.reaches];
    const word = CONFIDENCE_WORD[level].en;
    const note = !held
      ? def.note
      : (def.held?.[reason] ??
        (heldBefore
          ? `Still ${word}: this stream agrees, but it doesn't widen the margin.`
          : `Held at ${word} by this flag's own numbers. ${ownWhy(flag)}`));
    heldBefore ||= held;
    steps.push({
      streamId: stream.id,
      label: stream.label,
      system: stream.system,
      simulated: stream.simulated,
      corroborates: stream.corroborates && def.contradicts !== reason,
      level,
      note,
    });
  }
  return steps;
}

/** The step the flag card shows: the last one built from real streams. */
export function defaultStepIndex(steps: readonly StreamStep[]): number {
  return steps.findLastIndex((s) => !s.simulated);
}

/**
 * Independent families agreeing by step `i`: the distinct source systems among the steps so far
 * that back the flag (the truck's own telematics counts once).
 */
export function familiesAt(steps: readonly StreamStep[], i: number): number {
  return new Set(
    steps
      .slice(0, i + 1)
      .filter((s) => s.corroborates)
      .map((s) => s.system),
  ).size;
}
