/**
 * Structural shifts vs hype, for /bet (TASK-28; docs/bet/research-report.md §5–§7). Each item
 * has a one-line mechanism (our reading of the research, labelled as an assumption) and the
 * evidence behind it, cited no further than each source's snippet. The rails' evidence is
 * BET_OVERVIEW's own "why now" claims, so the overview states each fact once.
 * Pure copy: nothing here imports lib/data.
 */
import { MOTIVE_SPEND } from "./board";
import { BET_OVERVIEW } from "./copy";
import { claimMatching, type Claim } from "./sources";
import { STREAMS } from "./streams";

export interface TrendItem {
  id: string;
  name: string;
  /** How it works, or why it fails: one line. */
  mechanism: Claim;
  evidence: readonly Claim[];
}

const why = (re: RegExp) => claimMatching(BET_OVERVIEW.claims, re);

export const STRUCTURAL: readonly TrendItem[] = [
  {
    id: "rails",
    name: "India's public rails",
    mechanism: {
      text: "The state built FASTag, e-way bills and Account Aggregators once, so a per-truck ledger can be assembled from data that already flows.",
      assumption: true,
      basis: "Our reading (research report §5, trend 6, and §7.8, inversion 1). The rails' reach is cited; the low cost per truck is not measured.",
    },
    evidence: [why(/98%/), why(/e-way bills/i), why(/lakh crore/)],
  },
  {
    id: "telemetry",
    name: "Telemetry the truck already sends",
    mechanism: {
      text: "Mandated trackers and factory telematics put GPS and CAN data on the truck without a new box, but the fuel reading is coarse, so confidence must come from streams that agree.",
      assumption: true,
      basis: "Our reading (research report §5, trends 1 and 5, and H5). Mandated tracking is also unevenly enforced (§7.3).",
    },
    evidence: [
      why(/telemetry/),
      claimMatching(STREAMS["can-fuel"].claims, /patent/),
    ],
  },
  {
    id: "embedded-finance",
    name: "Embedded finance where the platform owns the transaction",
    mechanism: {
      text: "Finance pays where the platform controls the transaction; for a small Indian owner, that transaction is the used-truck loan.",
      assumption: true,
      basis: "Our judgment (research report §4, disagreement 3, and §5, trend 4).",
    },
    evidence: [
      { text: "Corpay's Vehicle Payments revenues were $2,138.7 million in 2025.", sourceIds: ["corpay-10k"] },
      { text: "Used-vehicle loan books grew 15% a year from FY20 to FY25, against 11% for new-vehicle loans.", sourceIds: ["used-cv-cagr"] },
    ],
  },
  {
    id: "whatsapp",
    name: "Distribution is WhatsApp, not an app",
    mechanism: {
      text: "No install and no new habit: the brief arrives where the owner already reads.",
      assumption: true,
      basis: "Our reading (research report §7.8, inversion 4). Whether owners act on a daily brief is untested (H2).",
    },
    evidence: [why(/WhatsApp/), why(/language models/)],
  },
];

export const HYPE: readonly TrendItem[] = [
  {
    id: "ai-agents",
    name: "“AI agents run the fleet”",
    mechanism: {
      text: "Even the leader hasn't priced its agents, and agents need clean inputs; India's are gamed and coarse. An agent acting on a bad flag hits a driver's pay, so autonomy is gated by streams that agree.",
      assumption: true,
      basis: "Our reading (research report §4 and §6, item 1), which takes the Samsara call below as being about its AI agents.",
    },
    evidence: [
      { text: "On its Q4 FY26 call, Samsara said it plans to first understand usage patterns before determining pricing.", sourceIds: ["samsara-agent-pricing"] },
      {
        text: "A plea in the Bombay High Court alleges RTOs used manipulated or mismatched tracker data to register vehicles without a physical installation.",
        sourceIds: ["ais140-rto-plea"],
      },
    ],
  },
  {
    id: "driverless",
    name: "Driverless trucks as a 5-year plan",
    mechanism: {
      text: "Driverless trucks run hub to hub on fixed, dry, permissive US lanes; Indian highways have mixed traffic and no framework for them.",
      assumption: true,
      basis: "An inference, not sourced (research report §6, item 2).",
    },
    evidence: [
      { text: "Aurora's Q2 2026 letter says it is fully allocated to exit the year with 200 driverless trucks in operation.", sourceIds: ["aurora-q2-2026"] },
    ],
  },
  {
    id: "data-marketplace",
    name: "Standalone vehicle-data marketplaces",
    mechanism: {
      text: "Buyers want outcomes, not raw feeds; data earns only inside a workflow.",
      assumption: true,
      basis: "Our reading (research report §5, trend 2, and §6, item 3).",
    },
    evidence: [{ text: "Wejo reported net revenue of $8.4 million and a net loss of $159.3 million before it went into administration.", sourceIds: ["wejo-collapse"] }],
  },
  {
    id: "fuel-card",
    name: "Fuel-card interchange",
    mechanism: {
      text: "Interchange skims a thin slice of spend, and in India UPI already makes payments cheap.",
      assumption: true,
      basis: "An inference with no sourced Indian figure (research report §6, item 4).",
    },
    evidence: [MOTIVE_SPEND],
  },
  {
    id: "heavy-ev",
    name: "Rapid heavy-truck electrification",
    mechanism: {
      text: "The subsidy funds a pilot, not a transition.",
      assumption: true,
      basis: "Our reading of the two figures below (research report §6, item 5).",
    },
    evidence: [
      { text: "PM E-DRIVE will support 5,643 e-trucks with a total allocation of ₹500 crore.", sourceIds: ["pm-edrive-etrucks"] },
      { text: "India's trucking industry comprises about 12.5 million trucks.", sourceIds: ["zinka-prospectus"] },
    ],
  },
];

export const HYPE_COPY = {
  structuralHeading: "Structural: build on it",
  structuralLede: "Shifts with a mechanism behind them. These are why now.",
  hypeHeading: "Hype: don't plan on it",
  hypeLede: "Claims that won't survive contact with India, and the mechanism of failure.",
  mechanismLabel: "Mechanism",
  failureLabel: "Why it fails",
} as const;
