/**
 * Copy and view data for Why Urja (final/why.html; Design.md §25). The fleet
 * numbers the essay states come from lib/data, never from typed copy.
 */
import { dayKey } from "@/lib/clock";
import { getDataset } from "@/lib/data";
import { FLEET } from "@/lib/data/fleet";
import { SHELL } from "@/lib/site-shell";

/** The page title (Design.md §25 seo_intent; the brand line in technical-plan §1). */
export const WHY_TITLE = "Why Urja · a concept for Bytebeam";

/** The hero byline (EXE19: the author line confirmed by the user). */
export const BYLINE = { concept: "A concept for Bytebeam", author: "Tushar Pathak", role: "Product Manager", date: "September 2026" } as const;

export interface WhyView {
  byline: string;
  fleetName: string;
  /** Trucks in the simulated fleet. */
  truckCount: number;
  /** Calendar days (IST) on which the simulated trips ended. */
  tripDays: number;
}

export function getWhyView(): WhyView {
  const tripDays = new Set(getDataset().trips.map((t) => dayKey(t.end))).size;
  return {
    byline: `${BYLINE.concept} · ${BYLINE.author} · ${BYLINE.role} · ${BYLINE.date}`,
    fleetName: SHELL.fleetName,
    truckCount: FLEET.length,
    tripDays,
  };
}

/** Chapter 03: what each product does well, and what the small-fleet owner still lacks. */
export interface Competitor {
  name: string;
  does: string;
  /** `null`: nothing missing (shown as a dash, read as "nothing missing"). */
  lacks: string | null;
  /** Urja's own row, lit. */
  us?: boolean;
}

export const COMPETITORS: readonly Competitor[] = [
  { name: "Fleetx", does: "Fuel-sensor alerts for diesel drops, FASTag, trip P&L, TMS", lacks: "Needs an extra fuel sensor; built around a dashboard" },
  { name: "Intangles", does: "Predictive maintenance, digital twin", lacks: "Answers “will it break?”, not “where did my money go?”" },
  { name: "LocoNav", does: "GPS, video telematics, driver scorecards", lacks: "Scores drivers without asking their side" },
  { name: "Samsara", does: "AI agents and daily fleet summaries (US)", lacks: "Not built for Indian roads, Hindi, or FASTag" },
  { name: "Urja", does: "One morning answer in rupees, with evidence and the driver’s side", lacks: null, us: true },
];

/** Chapter 04: from the truck to the owner's WhatsApp. Only the new parts are lit. */
export interface PipeNode {
  name: string;
  detail: string;
  isNew: boolean;
}

export const PIPELINE: readonly PipeNode[] = [
  { name: "CAN / DBC parsers", detail: "fuel level, odometer", isNew: false },
  { name: "Streams", detail: "30-second telemetry", isNew: false },
  { name: "Geofences", detail: "pumps, plazas, yards", isNew: false },
  { name: "Leakage rules", detail: "5 rules + confidence", isNew: true },
  { name: "Brief + Ask Urja", detail: "Hindi / English", isNew: true },
  { name: "WhatsApp alerts", detail: "delivery at 7 AM", isNew: false },
];

/** Chapter 05: the success metric (lit) and the guardrail. The metric names a unit, not an amount. */
export interface MetricTile {
  label: string;
  ariaLabel: string;
  value: string;
  unit: string;
  lit: boolean;
  /** A bold lead-in before the detail, if any. */
  lead?: string;
  detail: string;
}

export const METRICS: readonly MetricTile[] = [
  {
    label: "Success metric",
    ariaLabel: "Success metric: rupees recovered per truck per month",
    value: "₹ recovered",
    unit: "/ truck / month",
    lit: true,
    detail: "Leading signals: share of mornings the owner opens the brief; share of flags acted on within 24 hours.",
  },
  {
    label: "Guardrail",
    ariaLabel: "Guardrail: under 10 percent wrong flags",
    value: "< 10%",
    unit: "wrong flags",
    lit: false,
    lead: "False-accusation rate under 10%:",
    detail:
      "flags the driver disputes and the owner accepts as innocent. If Urja works too well, owners blame drivers for sensor glitches and good drivers leave. Watch driver 90-day retention too.",
  },
];

/** Chapter 06: what I'd do if I joined. */
export interface PlanPhase {
  phase: string;
  text: string;
}

export const FIRST_90_DAYS: readonly PlanPhase[] = [
  {
    phase: "Days 1–30",
    text: "Sit with 15 fleet owners and their munshis in Jaipur, Kishangarh and Delhi transport hubs. Map how a trip is reconciled today, and what they do when diesel goes missing.",
  },
  {
    phase: "Days 31–60",
    text: "Pilot the five rules on 3 fleets’ real CAN data. Measure the false-flag rate before any owner sees a flag.",
  },
  {
    phase: "Days 61–90",
    text: "Ship the WhatsApp brief to the pilot owners. Go or no-go on ₹ recovered per truck and the guardrail.",
  },
];
