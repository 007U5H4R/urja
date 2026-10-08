/**
 * Copy and view data for /demo (TASK-33, EXE49): a six-step guided path through the prototype,
 * opened by "Start the demo" on Why Urja. English only. The Today and lender figures come from
 * the views (getTodayHead, getTruckView), never typed here.
 */
import { getTruckView } from "@/lib/bet/views/truck";
import { DEMO_NOW } from "@/lib/clock";
import { getTodayHead } from "@/lib/data/views/today";
import { formatDateIST, formatINR, formatTimeIST, minToISTParts } from "@/lib/format";
import { SHELL } from "@/lib/site-shell";

/** The demo clock as the intro states it: "Mon 28 Sep 2026, 7:12 AM" (IST). */
export function demoClock(): string {
  return `${formatDateIST(DEMO_NOW, "weekday-day-month")} ${minToISTParts(DEMO_NOW).year}, ${formatTimeIST(DEMO_NOW)}`;
}

export const DEMO_COPY = {
  title: "The demo · Urja",
  h1: "The 3-minute demo",
  description: `Six stops through Urja: the 7 AM message, Today, a flagged trip and its Flag lab, the bet, its tiers and the lender view. A prototype on the simulated ${SHELL.fleetName} fleet, with the clock at ${demoClock()}.`,
  path: "/demo",
  stepsLabel: "Demo steps",
} as const;

/** The truck the lender-view step opens (the bet's lender teaser). */
const LENDER_SLUG = "rj14-gb-4521";

export interface DemoStep {
  title: string;
  /** One line: what to look at. */
  look: string;
  href: string;
  /** The button's text. */
  cta: string;
  /** The link opens another root layout (the phone screens, EXE23): a full page load, not prefetched. */
  crossLayout: boolean;
}

export interface DemoView {
  intro: string;
  steps: readonly DemoStep[];
}

export function getDemoView(): DemoView {
  const v = getTodayHead().verdict;
  const truck = getTruckView(LENDER_SLUG);
  if (!truck) throw new Error(`No truck for ${LENDER_SLUG}`);
  const flagged = `${v.flaggedTrips} flagged ${v.flaggedTrips === 1 ? "trip" : "trips"}`;
  return {
    intro: `A prototype on a simulated fleet, ${SHELL.fleetName}, with the demo clock at ${demoClock()}. Six stops, in order.`,
    steps: [
      {
        title: "The 7 AM message",
        look: "The owner’s WhatsApp brief, in Hindi; toggle EN to read it in English.",
        href: "/message",
        cta: "Open the message",
        crossLayout: true,
      },
      {
        title: "Today",
        look: `Yesterday’s verdict: ${formatINR(v.earnedInr)} earned, and ${formatINR(v.unaccountedInr)} of it doesn’t add up, across ${flagged}.`,
        href: "/",
        cta: "Open Today",
        crossLayout: false,
      },
      {
        title: "A flagged trip and the Flag lab",
        look: "It opens on step 4, High on one family; step to 5, the simulated camera, for a second family, then switch to Autopilot and L4’s auto-hold becomes available.",
        href: "/trips/0926-04#flag-lab",
        cta: "Open the Flag lab",
        crossLayout: false,
      },
      {
        title: "The bet",
        look: "The SuprFleet bet at a glance: from closed books to credit, with the owner’s consent.",
        href: "/bet",
        cta: "See the bet",
        crossLayout: false,
      },
      {
        title: "Tiers and who pays",
        look: "What each tier does for the owner, and who pays for it.",
        href: "/bet/tiers",
        cta: "See the tiers",
        crossLayout: false,
      },
      {
        title: "The lender view",
        look: `One truck as a lender reads it: ${truck.verified.text}, and no projections.`,
        href: `/trucks/${LENDER_SLUG}`,
        cta: "Open the lender view",
        crossLayout: false,
      },
    ],
  };
}
