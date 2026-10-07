/**
 * The roadmap and what we are not building, for /bet (TASK-28; docs/bet/bet-spec.md §10,
 * frozen). These are our plans, not findings, so the page labels them as a plan.
 * Pure copy: nothing here imports lib/data.
 */
import type { Claim } from "./sources";

export interface RoadmapPhase {
  id: "phase-1" | "phase-2" | "phase-3";
  name: string;
  /** "0–6 months". */
  window: string;
  items: readonly string[];
}

export const ROADMAP: readonly RoadmapPhase[] = [
  {
    id: "phase-1",
    name: "Phase 1",
    window: "0–6 months",
    items: [
      "The daily close, brief and evidence on existing streams (AIS-140/OEM, FASTag, e-way bill, bill OCR)",
      "L1–L2",
      "3 pilot fleets in Jaipur, Kishangarh and Delhi",
      "Measure the wrong-flag rate before owners see flags",
    ],
  },
  {
    id: "phase-2",
    name: "Phase 2",
    window: "6–12 months",
    items: [
      "L3 SOPs, L4 guardrails, benchmarks",
      "The first NBFC lending partnership, with consent flow (AA/DPDP)",
      "The EV 2W/3W delivery-fleet ledger, adding battery health",
    ],
  },
  {
    id: "phase-3",
    name: "Phase 3",
    window: "12–24 months",
    items: [
      "Insurance pricing, once IRDAI's commercial-vehicle pay-as-you-drive matures",
      "Resale certificates",
      "Self-closing settlement",
    ],
  },
];

export const NOT_BUILDING: readonly string[] = [
  "Our own hardware or dongle",
  "Video dashcams for the long tail",
  "A load marketplace",
  "Our own NBFC (a stated option later, not now)",
  "A fuel card",
  "Driver scoring without the driver's side",
];

export const ROADMAP_COPY = {
  notBuildingHeading: "Not building",
  claim: {
    text: "The phases and their timing are our plan, not a commitment anyone has made.",
    assumption: true,
    basis: "bet-spec §10. The pilots, the lending partner and the EV ledger are all still to be won.",
  } satisfies Claim,
} as const;
