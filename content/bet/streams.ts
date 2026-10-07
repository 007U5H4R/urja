/**
 * Streams and the per-rule stream ladders for the flag lab (TASK-22; docs/bet/bet-spec.md §6).
 *
 * - A stream is one source of evidence the munshi can read. `family` is the spec's §6 column
 *   (position, fuel, place …): a stream *kind*, not what the guardrail counts. `system` is where
 *   the reading physically comes from; streams from one system fail together (a tampered tracker
 *   breaks GPS, fuel level and geofence at once), so the guardrail counts independent *systems*,
 *   which the UI calls "independent families" and explains with FAMILIES_NOTE (EXE43). The four
 *   truck-telematics streams are therefore one family, and a camera adds a second (§6 showcase
 *   0926-04).
 * - A typed fuel bill is the claim being checked, not a witness, so it does not count towards
 *   independence (`corroborates: false`). A step can also argue against a flag (`contradicts`):
 *   R3's e-way bill showing a heavier load than usual explains the extra diesel instead of
 *   backing the flag, so there it is no agreeing family.
 * - A ladder lists, in order, the streams that build a rule's evidence and the level each step
 *   can reach on its own (`reaches`). lib/bet/fusion.ts lowers a step to the flag's own grade
 *   when the flag's margin or a cap holds it, so the last real step always equals the flag.
 *
 * Every stream's claims cite content/bet/sources.ts or are labelled assumptions with a basis.
 * Pure copy: nothing here imports lib/data.
 */
import type { Claim } from "./sources";

export type StreamLevel = "high" | "likely" | "check";
export type StreamRule = "R1" | "R2" | "R3" | "R4" | "R5";

export type StreamId =
  | "gps-ignition"
  | "can-fuel"
  | "geofence"
  | "fastag"
  | "eway-bill"
  | "fuel-bill-typed"
  | "bill-ocr"
  | "fleet-history"
  | "camera";

/** The spec's family column (§6): the kind of stream, not an independent family (see StreamSystem). */
export type StreamFamily = "position" | "fuel" | "place" | "money/place" | "load/trip" | "money" | "baseline" | "visual";

/** Where a stream's reading comes from; one system counts as one independent family. */
export type StreamSystem = "truck-telematics" | "toll-network" | "gst-network" | "hand-typed" | "pump-bill" | "camera";

/** Where each system's readings come from, as the flag lab names a step's source. */
export const SYSTEM_LABEL: Readonly<Record<StreamSystem, string>> = {
  "truck-telematics": "The truck's tracker",
  "toll-network": "FASTag (bank records)",
  "gst-network": "E-way bill (GST network)",
  "hand-typed": "Typed by hand",
  "pump-bill": "The pump's printed bill",
  camera: "Camera",
};

/** What "independent families" means, shown beside every family count (EXE43). */
export const FAMILIES_NOTE =
  "Independent families count separate sources, not stream types. GPS, the fuel sensor, geofences and fleet history all come from the truck's own tracker and would fail together, so they count as one family. FASTag, the e-way bill, the pump's printed bill and a camera each count as another. A hand-typed bill is the claim being checked, so it doesn't count.";

/** On a step whose stream is the claim under test. */
export const NOT_COUNTED_NOTE = "Doesn't count as a family: a hand-typed bill is the claim being checked, not a witness.";

export interface StreamDef {
  id: StreamId;
  label: string;
  family: StreamFamily;
  /** Built only as a simulation in the prototype; the UI labels it. */
  simulated: boolean;
  system: StreamSystem;
  /** Whether the stream is an independent witness (false for the claim being checked). */
  corroborates: boolean;
  /** The spec's "Exists today?" cell. */
  today: string;
  claims: readonly Claim[];
}

export const STREAMS: Readonly<Record<StreamId, StreamDef>> = {
  "gps-ignition": {
    id: "gps-ignition",
    label: "GPS · ignition",
    family: "position",
    simulated: false,
    system: "truck-telematics",
    corroborates: true,
    today: "Yes, mandated",
    claims: [
      {
        text: "National-permit goods carriers must carry a vehicle location tracking device (AIS-140).",
        sourceIds: ["ais140-rule-125h", "ais140-deadline"],
      },
      { text: "Truck makers ship factory telematics too.", sourceIds: ["tata-fleet-edge"] },
    ],
  },
  "can-fuel": {
    id: "can-fuel",
    label: "CAN fuel level",
    family: "fuel",
    simulated: false,
    system: "truck-telematics",
    corroborates: true,
    today: "Yes on BS-VI, coarse",
    claims: [
      { text: "Factory fuel-level sensors read in coarse steps of about 10–40 L.", sourceIds: ["can-fuel-steps"] },
      {
        text: "BS-VI trucks report the fuel level over the CAN bus.",
        assumption: true,
        basis: "The bet-spec §6 stream table; not separately sourced yet.",
      },
    ],
  },
  geofence: {
    id: "geofence",
    label: "Geofence",
    family: "place",
    simulated: false,
    system: "truck-telematics",
    corroborates: true,
    today: "Platform",
    claims: [
      {
        text: "Geofences for pumps, plazas and yards come from GPS and a place list, with no new hardware.",
        assumption: true,
        basis: "How the prototype draws them: 300 m pump circles on the simulated map (technical-plan §4.4).",
      },
    ],
  },
  fastag: {
    id: "fastag",
    label: "FASTag",
    family: "money/place",
    simulated: false,
    system: "toll-network",
    corroborates: true,
    today: "Yes, >98% of NH tolls",
    claims: [{ text: "FASTag collects more than 98% of national-highway tolls.", sourceIds: ["fastag-98"] }],
  },
  "eway-bill": {
    id: "eway-bill",
    label: "E-way bill / ULIP",
    family: "load/trip",
    simulated: false,
    system: "gst-network",
    corroborates: true,
    today: "Yes, ~140 M a month",
    claims: [
      { text: "E-way bills hit a record of about 140 million in March 2026.", sourceIds: ["eway-bills"] },
      {
        text: "The e-way bill's route and load stand in for the prototype's trip plan.",
        assumption: true,
        basis: "The simulated trips carry a planned route and load; a live product would read them from the e-way bill or ULIP.",
      },
    ],
  },
  "fuel-bill-typed": {
    id: "fuel-bill-typed",
    label: "Fuel bill (typed)",
    family: "money",
    simulated: false,
    system: "hand-typed",
    corroborates: false,
    today: "Yes, typed by hand",
    claims: [
      {
        text: "Fuel bills reach the owner typed by hand into a khata or a chat.",
        assumption: true,
        basis: "How the simulated munshi records fills; not field-tested.",
      },
    ],
  },
  "bill-ocr": {
    id: "bill-ocr",
    label: "Bill OCR",
    family: "money",
    simulated: true,
    system: "pump-bill",
    corroborates: true,
    today: "Simulated in the prototype",
    claims: [
      {
        text: "Reading the pump's printed bill with OCR removes the hand-typed step.",
        assumption: true,
        basis: "Simulated in the prototype; cost to serve assumes about 20 bills a truck a month (bet-spec §7).",
      },
    ],
  },
  "fleet-history": {
    id: "fleet-history",
    label: "Fleet history",
    family: "baseline",
    simulated: false,
    system: "truck-telematics",
    corroborates: true,
    today: "Platform",
    claims: [
      {
        text: "Each truck's normal per route, and where flags cluster, come from its own past trips.",
        assumption: true,
        basis: "Built from the simulated fleet's earlier trips (technical-plan §4.4).",
      },
    ],
  },
  camera: {
    id: "camera",
    label: "Camera",
    family: "visual",
    simulated: true,
    system: "camera",
    corroborates: true,
    today: "Optional, simulated in the prototype",
    claims: [
      {
        text: "An optional cab or tank camera is a witness independent of the tracker.",
        assumption: true,
        basis: "Simulated in the prototype; optional hardware the owner would add.",
      },
    ],
  },
};

/** How a step was held below what its stream reaches on its own. */
export type HeldReason = "margin" | "load-cap";

export interface LadderStepDef {
  stream: StreamId;
  /** The level the evidence so far supports when nothing else holds it down. */
  reaches: StreamLevel;
  /** When the step reaches its level. */
  note: string;
  /** When the flag's margin or a cap holds the step lower; falls back to a note built from the flag. */
  held?: Partial<Record<HeldReason, string>>;
  /** A simulated stream that removes this cap: it reaches its level only when the cap was all that held the flag. */
  lifts?: "bill-cap";
  /** When the flag is held for this reason, the stream argues against the flag, so it is no agreeing family. */
  contradicts?: HeldReason;
  /** Why it doesn't count when it contradicts; required with `contradicts`. */
  againstNote?: string;
}

export interface RuleLadderDef {
  rule: StreamRule;
  ruleName: string;
  /** Real steps first, then any simulated ones. */
  steps: readonly LadderStepDef[];
  /** The basis for the levels on this ladder. */
  basis: Claim;
}

const LEVEL_BASIS =
  "Mirrors what the rule's grade weighs (margin over the threshold, GPS gaps, sensor noise, and its cap) in technical-plan §4.4; not field-tested.";

export const STREAM_LADDERS: Readonly<Record<StreamRule, RuleLadderDef>> = {
  R1: {
    rule: "R1",
    ruleName: "Stationary fuel drop",
    steps: [
      {
        stream: "gps-ignition",
        reaches: "check",
        note: "The truck stood still for a while away from any pump. That alone is worth a check, nothing more.",
      },
      {
        stream: "can-fuel",
        reaches: "likely",
        note: "The fuel level fell while the truck stood still. Factory sensors read in coarse 10–40 L steps, so a drop alone is Likely, not certain.",
      },
      {
        stream: "geofence",
        reaches: "likely",
        note: "No pump within its geofence, so this was not a fill or a pump reading. Still Likely until the sensor's own record backs the size of the drop.",
      },
      {
        stream: "fleet-history",
        reaches: "high",
        note: "With the sensor steady for the rest of the trip and the stretch's record this month, the drop is far outside chance: High.",
      },
      {
        stream: "camera",
        reaches: "high",
        note: "A camera clip of the stop is a witness independent of the tracker. It doesn't change the reading, but it adds a second family, which a guardrail needs.",
      },
    ],
    basis: { text: "Each step's level on the stationary-drop ladder.", assumption: true, basis: LEVEL_BASIS },
  },
  R2: {
    rule: "R2",
    ruleName: "Refuel mismatch",
    steps: [
      {
        stream: "fuel-bill-typed",
        reaches: "check",
        note: "A typed bill says how many litres were filled. On its own it is only a claim to check.",
      },
      {
        stream: "can-fuel",
        reaches: "likely",
        note: "The tank rose by less than the bill says, read 5 minutes before and 10 minutes after the fill.",
      },
      {
        stream: "geofence",
        reaches: "likely",
        note: "The truck was at the pump on the bill, at that time. Likely: the cap holds. The litres were typed by hand, a bill can also cover cans or a second tank, and there is no pump-meter record to check against.",
      },
      {
        stream: "bill-ocr",
        reaches: "high",
        lifts: "bill-cap",
        note: "Bill OCR reads the pump's printed bill, the pump's own record of the litres, so they are no longer typed by hand. The cap lifts and the gap holds: High. A second tank is the one thing a bill can't rule out, so the driver's side still matters.",
        held: {
          margin:
            "Bill OCR confirms the litres on the bill, but the gap over the 8% allowance is still narrow, so it stays at Check.",
        },
      },
    ],
    basis: { text: "Each step's level on the refuel-mismatch ladder.", assumption: true, basis: LEVEL_BASIS },
  },
  R3: {
    rule: "R3",
    ruleName: "Excess consumption",
    steps: [
      {
        stream: "fleet-history",
        reaches: "check",
        note: "The trip used more diesel than this truck's normal on the route. A baseline alone is worth a check.",
      },
      {
        stream: "eway-bill",
        reaches: "likely",
        note: "The load was within the usual for this route, so load doesn't explain the extra diesel.",
        contradicts: "load-cap",
        againstNote:
          "Argues against the flag here: the extra diesel may be the load, so it doesn't count as an agreeing family.",
        held: {
          "load-cap":
            "The e-way bill shows a heavier load than usual. This truck's normal doesn't allow for load, so the extra diesel may be the load: capped at Check.",
        },
      },
      {
        stream: "can-fuel",
        reaches: "high",
        note: "The fuel sensor shows the extra spread across the trip, steady and with no gaps: High.",
        held: {
          "load-cap":
            "Still Check. No stream lifts a load cap: the fuel sensor agrees, but only a load-adjusted norm can tell load from leakage, and that is on the roadmap.",
        },
      },
    ],
    basis: { text: "Each step's level on the excess-consumption ladder.", assumption: true, basis: LEVEL_BASIS },
  },
  R4: {
    rule: "R4",
    ruleName: "Route deviation",
    steps: [
      {
        stream: "gps-ignition",
        reaches: "check",
        note: "GPS gives the distance driven. Without the plan, there is nothing to compare it with.",
      },
      {
        stream: "eway-bill",
        reaches: "likely",
        note: "Against the planned route on the trip's paperwork, the truck drove further than the plan allows.",
      },
      {
        stream: "geofence",
        reaches: "high",
        note: "The corridor check shows where the truck left the planned route, with the GPS track unbroken: High.",
      },
      {
        stream: "fleet-history",
        reaches: "high",
        note: "This truck's usual km per litre turns the extra km into the rupees of diesel shown.",
      },
    ],
    basis: { text: "Each step's level on the route-deviation ladder.", assumption: true, basis: LEVEL_BASIS },
  },
  R5: {
    rule: "R5",
    ruleName: "Toll mismatch",
    steps: [
      {
        stream: "fastag",
        reaches: "likely",
        note: "FASTag deductions are exact bank records, and the toll claim is above them. A plaza that failed to read the tag and took cash would explain it, so Likely.",
      },
      {
        stream: "gps-ignition",
        reaches: "high",
        note: "GPS tracked the whole trip with no gaps, so the route and the plazas on it are known: High.",
      },
    ],
    basis: { text: "Each step's level on the toll-mismatch ladder.", assumption: true, basis: LEVEL_BASIS },
  },
};
