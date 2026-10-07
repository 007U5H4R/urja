/**
 * The board for /bet (TASK-28; docs/bet/bet-spec.md §4, frozen): segments × jobs, where we play,
 * and the candidates we dropped. Cell text is the spec's own; each dropped candidate's reason is
 * our judgment, labelled, and its evidence cites content/bet/sources.ts where the spec cites it.
 * Pure copy: nothing here imports lib/data.
 */
import { claimMatching, type Claim } from "./sources";
import { STREAMS } from "./streams";

export type BoardJobId = "books" | "uptime" | "compliance" | "loads" | "finance" | "safety";
export type BoardSegmentId = "small-trucks" | "mid-large" | "ev-delivery" | "staff-buses" | "intercity-buses";
/** "open" is a cell we don't play in now; the other three are named on the cell in words. */
export type BoardCellState = "chosen" | "phase-1b" | "phase-2" | "open";

export const BOARD_STATE_LABEL: Readonly<Record<Exclude<BoardCellState, "open">, string>> = {
  chosen: "Chosen",
  "phase-1b": "Phase 1b",
  "phase-2": "Phase 2",
};

export interface BoardCell {
  state: BoardCellState;
  /** The spec's cell text; "" where the spec gives only the state. */
  text: string;
}

export interface BoardRow {
  id: BoardSegmentId;
  label: string;
  /** A line under the segment's name. */
  note?: string;
  cells: Readonly<Record<BoardJobId, BoardCell>>;
}

/** bet-spec §4's columns, in order. */
export const BOARD_JOBS: readonly { id: BoardJobId; label: string }[] = [
  { id: "books", label: "Leakage and books" },
  { id: "uptime", label: "Uptime and maintenance" },
  { id: "compliance", label: "Compliance" },
  { id: "loads", label: "Find loads" },
  { id: "finance", label: "Finance and insure the asset" },
  { id: "safety", label: "Driver safety" },
];

const open = (text: string): BoardCell => ({ state: "open", text });

/** bet-spec §4's rows, in order. */
export const BOARD_ROWS: readonly BoardRow[] = [
  {
    id: "small-trucks",
    label: "Small trucks (1–20)",
    note: "Phase 1 segment",
    cells: {
      books: { state: "chosen", text: "Phase 1" },
      uptime: open("Intangles is strong, low WTP"),
      compliance: open("AIS-140 is a commodity"),
      loads: open("BlackBuck/Vahak network effects"),
      finance: { state: "phase-1b", text: "Via the ledger" },
      safety: open("Video hardware too costly"),
    },
  },
  {
    id: "mid-large",
    label: "Mid/large trucks",
    cells: {
      books: open("Fleetx serves it"),
      uptime: open("Intangles"),
      compliance: open("Served"),
      loads: open("Brokers"),
      finance: open("NBFCs in-house"),
      safety: open("Netradyne/Lytx"),
    },
  },
  {
    id: "ev-delivery",
    label: "EV 2W/3W delivery",
    note: "Phase 2 segment",
    cells: {
      books: { state: "phase-2", text: "" },
      uptime: open("Bytebeam OEM base"),
      compliance: open("Light"),
      loads: open("Platforms"),
      finance: { state: "phase-2", text: "Battery and earnings ledger" },
      safety: open("Low priority"),
    },
  },
  {
    id: "staff-buses",
    label: "Staff/school buses",
    cells: {
      books: open("Low pain"),
      uptime: open("Medium"),
      compliance: open("High (school safety)"),
      loads: open("n/a"),
      finance: open("n/a"),
      safety: open("Medium"),
    },
  },
  {
    id: "intercity-buses",
    label: "Intercity buses",
    cells: {
      books: open("Medium"),
      uptime: open("Medium"),
      compliance: open("Medium"),
      loads: open("n/a"),
      finance: open("n/a"),
      safety: open("Medium"),
    },
  },
];

export const BOARD_COPY = {
  caption: "The board: segments by jobs. Cells marked Chosen, Phase 1b or Phase 2 are where we play; the rest say who serves the cell or why we pass.",
  regionLabel: "Board table, segments by jobs",
  hint: "The board scrolls sideways to show all six jobs.",
  droppedHeading: "What we dropped, and why",
  claims: [
    {
      text: "The cells are our reading of who serves each one; the bus rows are judgments, not research.",
      assumption: true,
      basis: "None of the three research memos studied buses (research report §3.1); a field check could reopen those rows.",
    },
  ] satisfies Claim[],
} as const;

export interface DroppedCandidate {
  id: string;
  name: string;
  /** The reason first (our judgment, labelled), then the evidence the spec cites. */
  claims: readonly Claim[];
}

/** Fuel cards earn little even for the US leader; the board and the hype list both lean on it. */
export const MOTIVE_SPEND: Claim = {
  text: "Motive's S-1 says Spend Management contributed about 2%, 3% and 4% of its revenue.",
  sourceIds: ["motive-s1"],
};

/** India's insurance telematics: allowed on paper, not yet mainstream (also H7's evidence). */
export const IRDAI_PAYD: Claim = {
  text: "IRDAI allowed pay-as-you-drive and pay-how-you-drive add-ons in July 2022.",
  sourceIds: ["irdai-payd-2022"],
};
export const IRDAI_OBSTACLES: Claim = {
  text: "IRDAI has identified five obstacles to telematics-based insurance gaining mainstream acceptance.",
  sourceIds: ["irdai-telematics"],
};

const JUDGMENT = "Our judgment from the research (research report §3.4).";

/** bet-spec §4's dropped candidates, in order. */
export const DROPPED: readonly DroppedCandidate[] = [
  {
    id: "load-matching",
    name: "Load matching",
    claims: [
      { text: "Network effects favour the incumbents.", assumption: true, basis: JUDGMENT },
      { text: "Vahak says more than 20 lakh transport businesses are registered on it.", sourceIds: ["vahak-network"] },
    ],
  },
  {
    id: "predictive-maintenance",
    name: "Predictive maintenance",
    claims: [
      {
        text: "Intangles is strong here, and the payoff for a small owner is slower.",
        assumption: true,
        basis:
          "Our judgment. The research report records Intangles at 500,000+ vehicles from a press release whose link was not captured, so we don't cite it (research report §3.4).",
      },
    ],
  },
  {
    id: "compliance",
    name: "Compliance on autopilot",
    claims: [
      { text: "AIS-140 makes tracking a commodity floor that incumbents can copy.", assumption: true, basis: JUDGMENT },
      // Both scopes cited together (Rule 125H and the Fleetx guide disagree), as the stream card does.
      claimMatching(STREAMS["gps-ignition"].claims, /AIS-140/),
      { text: "AIS-140 hardware costs between ₹2,800 and ₹5,500 per vehicle.", sourceIds: ["ais140-device-price"] },
    ],
  },
  {
    id: "video-safety",
    name: "Video-AI safety",
    claims: [
      {
        text: "Device and data costs don't fit the long tail, and the return needs an insurer who pays.",
        assumption: true,
        basis: JUDGMENT,
      },
      { text: "In the US, Progressive offers carriers that share ELD data discounts of 3–15%.", sourceIds: ["progressive-smart-haul"] },
    ],
  },
  {
    id: "fuel-card",
    name: "Fuel card",
    claims: [
      {
        text: "Interchange is thin in India.",
        assumption: true,
        basis: "An inference: the research found no sourced Indian figure (research report §6).",
      },
      MOTIVE_SPEND,
    ],
  },
  {
    id: "insurance-now",
    name: "Insurance telematics now",
    claims: [
      {
        text: "The products found are for private cars, and no commercial-vehicle programme was found, so this waits for phase 3.",
        assumption: true,
        basis: "Our reading of the research (research report §7.5).",
      },
      IRDAI_PAYD,
      IRDAI_OBSTACLES,
    ],
  },
];
