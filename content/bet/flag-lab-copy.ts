/**
 * Copy for the flag lab on a trip page (TASK-25): the section's head, its control labels, the
 * state words and the live-region lines. The numbers and the per-flag text come from the view
 * (lib/bet/views/flag-lab.ts); this file holds only the static words around them.
 *
 * Pure copy: nothing here imports lib/data. English only (EXE39).
 */
import { PROTOTYPE_NOTE } from "./copy";
import { LADDER_CLAIMS } from "./ladder";
import { isCited, type Claim } from "./sources";
import { STREAM_LADDERS, STREAMS, type StreamId, type StreamRule } from "./streams";

export interface AnnounceArgs {
  /** 1-based step. */
  step: number;
  total: number;
  levelWord: string;
  familiesText: string;
  /** The chosen tier's label. */
  tier: string;
  /** The highest unlocked level's id ("L2"). */
  unlockedThrough: string;
  /** How many actions are available at this step on this tier. */
  available: number;
}

export const FLAG_LAB_COPY = {
  id: "flag-lab",
  heading: "Flag lab",
  tag: "Prototype",
  intro: {
    lead: "A prototype of the SuprFleet bet, not something Urja does today: add the evidence streams one at a time and watch how confidence changes, then pick a tier to see what the munshi may do with it. Camera and bill OCR are simulated.",
    link: "Read the bet",
    href: "/bet",
  },
  flagLabel: "Flag",
  steps: {
    heading: "More streams, more confidence",
    control: "Streams added",
    now: "Confidence now",
    familiesTitle: "What counts as a family",
  },
  stepCount: (step: number, total: number) => `Step ${step} of ${total}`,
  stepValueText: (step: number, total: number, label: string, levelWord: string) => `Step ${step} of ${total}: ${label}, ${levelWord}`,
  stepState: { later: "Not added yet" },
  ladder: {
    heading: "More confidence and a higher tier, more autonomy",
    control: "Tier",
  },
  lock: { unlocked: "Unlocked", locked: "Locked", future: "Future" },
  /** The short word before an action's reason; none for a future one, whose reason already says so. */
  actionState: {
    available: "Ready",
    "needs-confidence": "Not yet",
    "needs-tier": "Locked",
    closed: "Closed",
    future: "",
  },
  actionNote: (label: string) => `${PROTOTYPE_NOTE}. Nothing was sent or changed: “${label}” is not carried out in this prototype.`,
  announce: ({ step, total, levelWord, familiesText, tier, unlockedThrough, available }: AnnounceArgs) => {
    const levels = unlockedThrough === "L1" ? "L1 unlocked" : `L1 to ${unlockedThrough} unlocked`;
    const acts = available === 0 ? "no action available" : `${available} ${available === 1 ? "action" : "actions"} available`;
    return `Step ${step} of ${total}: ${levelWord}, ${familiesText}. ${tier}: ${levels}, ${acts}.`;
  },
  claimsHeading: "Sources and assumptions behind the lab",
} as const;

/**
 * The lab's claims for a trip: each rule's level basis (once, in order); then the cited claims of
 * each stream the lab shows (once, in order), since a step note can quote a sourced figure (the
 * CAN fuel sensor's 10–40 L steps); then the ladder's assumptions.
 */
export function flagLabClaims(rules: readonly StreamRule[], streams: readonly StreamId[]): Claim[] {
  return [
    ...[...new Set(rules)].map((r) => STREAM_LADDERS[r].basis),
    ...[...new Set(streams)].flatMap((s) => STREAMS[s].claims.filter(isCited)),
    ...LADDER_CLAIMS,
  ];
}
