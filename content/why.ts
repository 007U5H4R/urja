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

/**
 * Chapter 01 (TASK-34, EXE50): the user's own story, in the first person. It was one
 * conversation, not a study; the illustrative quotes and the research line follow it.
 */
export const ORIGIN = {
  label: "How it started",
  title: "It started with a lunch stop.",
  body: [
    "A few months ago I was riding my bike from Bengaluru to Mysore. Halfway, I stopped at a small dhaba for lunch and got talking to a truck owner sitting nearby. I asked how many trucks he owned. “24.”",
    "That changed the conversation. I asked: “How much money did your fleet actually make yesterday?” He couldn’t answer straight away. He depended on his munshi, registers and phone calls, and he would often find out something was wrong at month end, when the money was already gone.",
    "That was one conversation, not a study. But it pointed to a trust and visibility problem, not a dashboard problem.",
    "He doesn’t want another complicated system. He wants to be told every morning what happened yesterday, how much he earned, where the money doesn’t add up, and the evidence. That’s where Urja came from.",
  ],
} as const;

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
 * Chapter 05 (EXE50): Urja's North Star (lit), ₹ recovered per truck per month, and its guardrail,
 * wrong flags under 10%. The tiles name units, not amounts. METRICS_LAYER names the bet's layer above.
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
    ariaLabel: "North Star: ₹ recovered per truck per month",
    value: "₹ recovered",
    unit: "per truck per month",
    lit: true,
    lead: "Urja wins when owners recover money they’d otherwise lose.",
    detail: "Leading signals: share of mornings the owner opens the brief; share of flags acted on within 24 hours.",
  },
  {
    label: "Guardrail",
    ariaLabel: "Guardrail: wrong flags under 10 percent",
    value: "< 10%",
    unit: "wrong flags",
    lit: false,
    lead: "Wrong flags under 10%:",
    detail:
      "flags the driver disputes and the owner accepts as innocent. If Urja cries wolf, trust disappears, and good drivers leave. Watch driver 90-day retention too.",
  },
];

/** Chapter 05's one line under the tiles: the SuprFleet bet's North Star, the layer above (EXE50). */
export const METRICS_LAYER =
  "For the SuprFleet bet, the layer above is verified truck-months: the record a lender can finance against.";

/** Chapter 06: what I'd do if I joined; the user's plan, in order (EXE50). */
export interface PlanPhase {
  phase: string;
  text: string;
}

export const FIRST_90_DAYS: readonly PlanPhase[] = [
  {
    phase: "Days 1–30",
    text: "Sit with 15 fleet owners and their munshis. Map how a trip is reconciled today, and what they do when the money doesn’t add up.",
  },
  {
    phase: "Days 31–60",
    text: "Run the five rules on 3 fleets’ real CAN/telematics data. Measure the wrong-flag rate, and improve the rules before any owner sees a flag.",
  },
  {
    phase: "Days 61–90",
    text: "Ship the morning brief and Ask Urja to the pilot owners. Then go or no-go, on ₹ recovered per truck and the wrong-flag guardrail.",
  },
];

/** One tab of the bet in chapter 08's map: its name (the link), one line, and an optional second link. */
export interface BetTab {
  tab: string;
  href: string;
  line: string;
  /** Product's line also opens the Flag lab: "{lead} {label}{after}", the label a link. */
  lab?: { lead: string; label: string; href: string; after: string };
}

/** Chapter 08's map: the bet's tabs after the overview (EXE49), in tab order. */
export const BET_TABS: readonly BetTab[] = [
  { tab: "Where we play", href: "/bet/market", line: "The jobs we chose, the ones we dropped, and what is structural versus hype." },
  {
    tab: "Product",
    href: "/bet/product",
    line: "Where it is 5–10x better, and how far each data stream lets it act on its own.",
    lab: { lead: "Try it in the", label: "Flag lab", href: "/trips/0926-04#flag-lab", after: " on trip 0926-04." },
  },
  { tab: "Tiers", href: "/bet/tiers", line: "What each tier does, and who pays for it." },
  { tab: "Lender view", href: "/trucks/rj14-gb-4521", line: "One truck’s verified record, as a lender would read it." },
  { tab: "Plan", href: "/bet/plan", line: "The roadmap, the metrics, and the hypotheses H1–H7 still to test." },
  { tab: "Artifacts", href: "/bet/artifacts", line: "The strategy doc, the PRD, the deck, the pitch script and the research report." },
];

/**
 * Chapter 08: the bet (TASK-29, EXE37; TASK-33, EXE49). Urja's arc into the SuprFleet bet, /bet as
 * the one primary action, then a short map of the bet's tabs: one line and one link each.
 * English only (EXE39).
 */
export const BET_CHAPTER = {
  n: "08",
  label: "The bet",
  title: "From closed books to credit, with the owner’s consent.",
  /** TASK-34 (EXE50): links the story to the bet, before the body. */
  lead: "Once the owner trusts the morning answer, the same verified record becomes credit.",
  body: [
    "Urja is the munshi core: it closes a fleet owner’s books every morning. The SuprFleet bet, my answer to the SuprFleet 2030 brief, builds on it in steps: from closed books to verified truck-months a lender can finance against, then to loans through a lending partner, made only with the owner’s consent.",
    "This is a prototype on simulated data, and the research behind the bet is unverified until each source is opened and quoted.",
  ],
  cta: "See the bet",
  href: "/bet",
  moreLabel: "The bet, tab by tab",
  more: BET_TABS,
} as const;
