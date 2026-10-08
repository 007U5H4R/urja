/**
 * Copy and view data for /demo (TASK-33, EXE49): a six-step guided path through the prototype,
 * opened by "Start the demo" on Why Urja. TASK-34 (EXE50) tells it as the story: the lunch stop,
 * Mr. Sharma, the evidence, then the bet. English only. The Today, trip and lender figures come
 * from the data and its views (getTodayHead, the dataset's flag, getTruckView), never typed here.
 */
import { getTruckView } from "@/lib/bet/views/truck";
import { DEMO_NOW } from "@/lib/clock";
import { getDataset } from "@/lib/data";
import { FLEET } from "@/lib/data/fleet";
import { placeById } from "@/lib/data/places";
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
  description: `Urja's story in six stops: the 7 AM message, rupees not data, the evidence on a flagged trip and its Flag lab, the bet, who pays and what a lender sees. A prototype on the simulated ${SHELL.fleetName} fleet, with the clock at ${demoClock()}.`,
  path: "/demo",
  stepsLabel: "Demo steps",
} as const;

/** The truck the lender-view step opens (the bet's lender teaser). */
const LENDER_SLUG = "rj14-gb-4521";
/** The flag the evidence step tells (trip 0926-04's stationary fuel drop) and the trip it opens. */
const EVIDENCE_FLAG = "0926-04-R1";

export interface DemoStep {
  title: string;
  /** One line: what to look at. */
  look: string;
  /** An optional second line: how to use what the step opens (the Flag lab's instruction). */
  note?: string;
  href: string;
  /** The button's text. */
  cta: string;
  /** The link opens another root layout (the phone screens, EXE23): a full page load, not prefetched. */
  crossLayout: boolean;
}

export interface DemoView {
  /** The lunch stop, in two sentences (EXE50). */
  story: readonly string[];
  /** "Meet Mr. Sharma: 24 trucks out of Jaipur (simulated)." */
  meet: string;
  /** The prototype line: the simulated fleet and the demo clock. */
  intro: string;
  steps: readonly DemoStep[];
  /** The closing line, after the steps. */
  close: string;
}

/** Trip 0926-04's flag as the story tells it, from the dataset: time, place, litres, minutes, rupees. */
function evidenceLine(): string {
  const f = getDataset().flags.find((x) => x.id === EVIDENCE_FLAG);
  if (!f || f.litres === undefined || f.until === undefined || !f.placeId) throw new Error(`No stationary drop for ${EVIDENCE_FLAG}`);
  const near = placeById(f.placeId).name.en;
  return `At ${formatTimeIST(f.at)}, ${f.plate} was parked near ${near} with the ignition off, and the tank dropped ${f.litres} L in ${f.until - f.at} minutes, about ${formatINR(f.inr)}; Urja says it doesn’t add up, and the driver gets to explain.`;
}

export function getDemoView(): DemoView {
  const v = getTodayHead().verdict;
  const truck = getTruckView(LENDER_SLUG);
  if (!truck) throw new Error(`No truck for ${LENDER_SLUG}`);
  const trips = `${v.flaggedTrips} ${v.flaggedTrips === 1 ? "trip" : "trips"}`;
  return {
    story: [
      "It started with a lunch stop. On a bike ride from Bengaluru to Mysore, I met a truck owner with 24 trucks who couldn’t say what his fleet made yesterday; he’d find out at month end, when the money was already gone.",
    ],
    meet: `Urja is built for owners like him. Meet Mr. Sharma: ${FLEET.length} trucks out of Jaipur (simulated).`,
    intro: `A prototype on a simulated fleet, ${SHELL.fleetName}, with the demo clock at ${demoClock()}. Six stops, in order.`,
    close: "One morning. One answer. In rupees. With evidence. And with the driver’s side of the story.",
    steps: [
      {
        title: "7 AM: one message, in Hindi",
        look: "Instead of a dashboard, the owner gets one WhatsApp brief in Hindi; toggle EN to read it in English.",
        href: "/message",
        cta: "Open the message",
        crossLayout: true,
      },
      {
        title: "Rupees, not data",
        look: `Not where the trucks are, but what they made: ${formatINR(v.earnedInr)} earned yesterday, and ${formatINR(v.unaccountedInr)} of it doesn’t add up, across ${trips}.`,
        href: "/",
        cta: "Open Today",
        crossLayout: false,
      },
      {
        title: "Tap for the evidence",
        look: evidenceLine(),
        note: "The Flag lab opens on step 4, High on one family; step to 5, the simulated camera, for a second family, then switch to Autopilot and L4’s auto-hold becomes available.",
        href: "/trips/0926-04#flag-lab",
        cta: "Open the Flag lab",
        crossLayout: false,
      },
      {
        title: "When the money is trusted, the record becomes credit",
        look: "The SuprFleet bet: closed books become verified truck-months a lender can finance against, with the owner’s consent.",
        href: "/bet",
        cta: "See the bet",
        crossLayout: false,
      },
      {
        title: "Who pays",
        look: "What each tier does for the owner, and who pays for it.",
        href: "/bet/tiers",
        cta: "See the tiers",
        crossLayout: false,
      },
      {
        title: "What a lender sees",
        look: `One truck as a lender reads it: ${truck.verified.text}, and no projections.`,
        href: `/trucks/${LENDER_SLUG}`,
        cta: "Open the lender view",
        crossLayout: false,
      },
    ],
  };
}
