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

/**
 * Chapter 05: the North Star (lit), with ₹ recovered per truck as a primary metric, and the
 * guardrail. The tiles name units, not amounts (bet-spec §8–§9: the North Star is verified truck-months).
 */
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
    label: "North Star",
    ariaLabel: "North Star: verified truck-months",
    value: "Verified",
    unit: "truck-months",
    lit: true,
    lead: "Primary metric: ₹ recovered per truck per month.",
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
    text: "Pilot the five rules in shadow mode on 3 fleets’ real CAN data. Measure the false-flag rate before any owner sees a flag.",
  },
  {
    phase: "Days 61–90",
    text: "Ship the WhatsApp brief to the pilot owners, and start referral-pilot talks with one NBFC. Go or no-go on ₹ recovered per truck and the guardrail.",
  },
];

/**
 * Chapter 08: the bet (TASK-29, EXE37). Urja's arc into the SuprFleet bet, then links into the bet
 * section: /bet as the one primary action, and three deep links. English only (EXE39).
 */
export const BET_CHAPTER = {
  n: "08",
  label: "The bet",
  title: "From closed books to credit, with the owner’s consent.",
  body: [
    "Urja is the munshi core: it closes a fleet owner’s books every morning. The SuprFleet bet, my answer to the SuprFleet 2030 brief, builds on it in steps: from closed books to verified truck-months a lender can finance against, and then to loans through a lending partner, made only with the owner’s consent.",
    "This is a prototype on simulated data, and the research behind the bet is unverified until each source is opened and quoted.",
  ],
  cta: "See the bet",
  href: "/bet",
  moreLabel: "Or go straight to a piece of the bet",
  more: [
    { label: "Watch a flag earn its confidence on trip 0926-04", href: "/trips/0926-04#flag-lab" },
    { label: "Tiers, and who pays for each", href: "/bet/tiers" },
    { label: "One truck, as a lender sees it", href: "/trucks/rj14-gb-4521" },
  ],
} as const;
