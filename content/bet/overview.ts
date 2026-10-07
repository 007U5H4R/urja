/**
 * Copy for the /bet overview (TASK-28; docs/bet/bet-spec.md §1–§3 and §6–§7): the section
 * headings, the loop, the 5–10x, the streams × autonomy summary and the two teasers, plus
 * `overviewClaims()`, every claim the page renders in page order, from which the page numbers its
 * sources. Figures on the teasers come from lib/bet views, not from here.
 * Pure copy: nothing here imports lib/data.
 */
import { BOARD_COPY, DROPPED } from "./board";
import { BET_OVERVIEW, BET_TIERS, BET_TRUCK } from "./copy";
import { hypothesisClaims } from "./hypotheses";
import { HYPE, STRUCTURAL } from "./hype";
import { GUARDRAIL_MIN_FAMILIES, LADDER_LEVELS, TIERS, type LadderLevelId } from "./ladder";
import { METRICS_COPY, NORTH_STAR } from "./metrics";
import { ROADMAP_COPY } from "./roadmap";
import { claimMatching, type Claim } from "./sources";
import { FAMILIES_NOTE, type StreamLevel } from "./streams";
import { FUEL_SENSOR_TODAY, NO_NEW_HARDWARE_DESIGN } from "./tiers";
import { VERIFIED_MONTH } from "./trust";

export type OverviewSectionId =
  | "loop"
  | "tenx"
  | "board"
  | "shifts"
  | "autonomy"
  | "tiers"
  | "lender"
  | "roadmap"
  | "metrics"
  | "hypotheses";

/** The page's sections in order: the in-page nav and each section's h2. */
export const OVERVIEW_SECTIONS: readonly { id: OverviewSectionId; title: string; nav: string }[] = [
  { id: "loop", title: "The bet in one loop", nav: "Loop" },
  { id: "tenx", title: "The 5–10x", nav: "5–10x" },
  { id: "board", title: "The board", nav: "Board" },
  { id: "shifts", title: "Structural vs hype", nav: "Structural vs hype" },
  { id: "autonomy", title: "Streams × autonomy", nav: "Autonomy" },
  { id: "tiers", title: "Four tiers", nav: "Tiers" },
  { id: "lender", title: "The lender view", nav: "Lender view" },
  { id: "roadmap", title: "Roadmap", nav: "Roadmap" },
  { id: "metrics", title: "Metrics", nav: "Metrics" },
  { id: "hypotheses", title: "Hypotheses", nav: "Hypotheses" },
];

export const OVERVIEW_NAV_LABEL = "On this page";

export function sectionTitle(id: OverviewSectionId): string {
  return OVERVIEW_SECTIONS.find((s) => s.id === id)!.title;
}

// ── 1. The loop (bet-spec §1–§2) ─────────────────────────────────────────
export const LOOP = {
  /** The figure's caption and accessible name. */
  caption: "The loop: closed books become verified truck-months, which a consented lending partnership turns into cheaper credit, so the owner stays and the books keep closing.",
  steps: [
    { title: "Close the books daily", line: "Diesel, tolls and trips reconciled per truck, by morning." },
    { title: "Verified truck-months", line: `At least ${VERIFIED_MONTH.minDays} verified days in a month.` },
    { title: "A consented lending partnership", line: "The owner shares the ledger with a lender, by consent." },
    { title: "Cheaper credit", line: "The lender sees verified cash flow, not a blind used-truck loan." },
    { title: "The owner stays", line: "The ledger's history compounds; a copycat can't backfill it." },
  ],
  back: "Back to the start: the owner stays, so tomorrow's books close too.",
  claims: [
    {
      text: "Cheaper credit is the bet, not a finding.",
      assumption: true,
      basis: "No lender has priced a loan on this ledger, and the research found none paying a third party for telematics data (H4).",
    },
  ] satisfies Claim[],
} as const;

// ── 2. The 5–10x (bet-spec §3) ───────────────────────────────────────────
export interface TenXRow {
  id: string;
  dimension: string;
  /** bet-spec §3's "Multiple" column. */
  multiple: string;
  today: string;
  munshi: string;
  claims: readonly Claim[];
}

export const TENX = {
  lede: "Each multiple is worked out and defended separately. Only one of them is about speed.",
  todayLabel: "Today",
  munshiLabel: "With Munshi",
  rows: [
    {
      id: "time",
      dimension: "Time to know a leak",
      multiple: "~30x faster",
      today: "Month-end munshi register (~30 days)",
      munshi: "Next morning (1 day)",
      claims: [{ text: "Month-end reconciliation is typical for a small fleet.", assumption: true, basis: "bet-spec §3; untested by field calls." }],
    },
    {
      id: "hardware",
      dimension: "Hardware to measure fuel",
      multiple: "Removes the main barrier for the long tail",
      today: "A fuel sensor plus monthly software",
      munshi: "₹0 new hardware: stream fusion on existing feeds",
      claims: [FUEL_SENSOR_TODAY, NO_NEW_HARDWARE_DESIGN],
    },
    {
      id: "answer",
      dimension: "What the owner gets",
      multiple: "Changes the job, not the speed",
      today: "A dot on a map, or a manual khata",
      munshi: "A ₹ answer, evidence, the driver's side, and a next action",
      claims: [],
    },
    {
      id: "credit",
      dimension: "Credit access",
      multiple: "Lower-risk loans",
      today: "A used-truck loan priced without operating data",
      munshi: "The lender sees verified cash flow",
      claims: [
        claimMatching(BET_TRUCK.claims as readonly Claim[], /^Cholamandalam/),
        { text: "Verified cash flow should make for lower-risk loans.", assumption: true, basis: "bet-spec §3; untested with a lender." },
      ],
    },
  ] satisfies TenXRow[],
} as const;

// ── 3. The board (bet-spec §4): copy in ./board.ts ───────────────────────
export const BOARD_INTRO = {
  lede: "The whole board before any idea: five segments, six jobs. We play in one cell first.",
  segment: claimMatching(BET_OVERVIEW.claims, /^About 75%/),
} as const;

// ── 5. Streams × autonomy (bet-spec §6–§7) ───────────────────────────────
export interface Showcase {
  tripId: string;
  /** The confidence words the flag walks through as streams are added. */
  path: readonly StreamLevel[];
  note: string;
  /** The simulated stream that lifts it, if any. */
  simulated: string | null;
}

const GATES: Readonly<Record<LadderLevelId, string>> = {
  L1: "No gate",
  L2: "Hold needs Likely or above; recover needs High or your confirmation",
  L3: "No gate",
  L4: `High and at least ${GUARDRAIL_MIN_FAMILIES} independent families`,
  L5: "Future, not built now",
};

const tierLabel = (id: string | null) => (id ? TIERS.find((t) => t.id === id)!.label : "No tier yet");

export const AUTONOMY = {
  confidenceHeading: "More independent families, more confidence",
  confidenceLede: "Confidence rises only as independent stream families agree. A typed claim never vouches for itself.",
  familiesNote: FAMILIES_NOTE,
  levelWord: { check: "Check", likely: "Likely", high: "High" } as const satisfies Record<StreamLevel, string>,
  showcases: [
    { tripId: "0926-04", path: ["check", "likely", "high"], note: "Adding Camera adds a 2nd family, which unlocks L4.", simulated: "Camera" },
    { tripId: "0927-02", path: ["likely", "high"], note: "High once bill OCR replaces the hand-typed bill.", simulated: "Bill OCR" },
    { tripId: "0926-11", path: ["check"], note: "Stays at Check: no stream lifts a heavy-load cap. The honest counter-example.", simulated: null },
  ] satisfies Showcase[],
  showcasesLabel: "Three flags from the simulated fleet",
  tripLabel: "Trip",
  thenLabel: "then",
  gateLabel: "Gate:",
  ladderHeading: "Confidence plus a higher tier unlocks the next rung",
  ladder: LADDER_LEVELS.map((l) => ({ id: l.id, name: l.name, summary: l.summary, tier: tierLabel(l.tier), gate: GATES[l.id] })),
  link: { href: "/trips/0926-04#flag-lab", label: "See it on a real flag", line: "Trip 0926-04: add streams one by one and watch the ladder unlock." },
} as const;

// ── 6–7. The teasers: figures come from getTiersView() and getTruckView() ─
export const TEASERS = {
  tiers: { line: BET_TIERS.thesis, link: { href: "/bet/tiers", label: "How the tiers work" } },
  lender: {
    slug: "rj14-gb-4521",
    line: "One truck's verified ledger, read the way a lender would.",
    scoreLabel: "Trust score",
    link: { href: "/trucks/rj14-gb-4521", label: "Open the lender view" },
  },
} as const;

/** Every claim the overview renders, in page order, so the [n] numbers run down the page. */
export function overviewClaims(): Claim[] {
  return [
    ...LOOP.claims,
    ...TENX.rows.flatMap((r) => r.claims),
    BOARD_INTRO.segment,
    ...BOARD_COPY.claims,
    ...DROPPED.flatMap((d) => d.claims),
    ...[...STRUCTURAL, ...HYPE].flatMap((i) => [i.mechanism, ...i.evidence]),
    ROADMAP_COPY.claim,
    ...NORTH_STAR.definition,
    METRICS_COPY.claim,
    ...hypothesisClaims(),
  ];
}
