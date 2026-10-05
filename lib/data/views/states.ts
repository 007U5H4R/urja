/**
 * Screen-state specimens (TKT-11, technical-plan §5.6, Design.md §18): the copy
 * of final/states.html with every number computed from the dataset.
 *
 * - loading: yesterday's trips, the Udaipur-stretch ones still to check.
 * - empty: where the 24 trucks are now (§4.9: 11 on the road, 13 parked).
 * - clean: 24 Sep, a clean day of September, with its real totals.
 * - error: yesterday's Udaipur-stretch trips are late; the rest are ready.
 */
import { DEMO_NOW, MIN_PER_DAY, istMin } from "@/lib/clock";
import { MESSAGE_HOUR } from "@/lib/brief/template";
import { formatDateIST, formatTimeIST, minToISTParts } from "@/lib/format";
import { cleanDays, day, fleetNow, yesterday, type DayKey } from "../aggregates";
import { tripById } from "../index";
import { STRETCHES, routeById } from "../routes";
import type { Min } from "../types";

// ── Types ────────────────────────────────────────────────────────────────
export interface RichPart { text: string; bold?: boolean }
export interface SpecimenLink { text: string; href: string }
export interface SpecimenRail {
  total: number;
  step: number;
  segs: { from: number; to: number; s: "stop" }[];
  label: string;
}

export interface LoadingSpecimen {
  tag: string;
  /** 'Checking 17 trips against fuel, FASTag and GPS · ' + the bold '11 of 17 done'. */
  status: { lead: string; done: string };
  rail: SpecimenRail;
}

export interface EmptySpecimen {
  tag: string;
  title: string;
  copy: string;
  fleet: SpecimenLink;
  september: SpecimenLink;
}

export interface CleanSpecimen {
  dayKey: DayKey;
  tag: string;
  /** before + the lit amount + after. */
  title: { before: string; inr: number; after: string };
  copy: RichPart[];
  rail: SpecimenRail;
  ends: [string, string];
  ledger: SpecimenLink;
}

export interface ErrorSpecimen {
  tag: string;
  title: string;
  copy: string;
  ready: string;
  retry: string;
}

export interface StateSpecimens {
  loading: LoadingSpecimen;
  empty: EmptySpecimen;
  clean: CleanSpecimen;
  error: ErrorSpecimen;
}

// ── Text builders ────────────────────────────────────────────────────────
const APOS = "’";
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st. */
export function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** '9 PM', '2 AM'. */
function hourLabel(t: Min): string {
  const { hour } = minToISTParts(t);
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;
}

export function loadingStatus(trips: number, done: number): LoadingSpecimen["status"] {
  return {
    lead: `Checking ${trips} ${plural(trips, "trip", "trips")} against fuel, FASTag and GPS · `,
    done: `${done} of ${trips} done`,
  };
}

/** One tick per trip (charts.js `rail`, step 1): the first `done` lit, the rest dim. */
function progressRail(trips: number, done: number, label: string): SpecimenRail {
  const last = Math.max(0, trips - 1);
  return { total: last, step: 1, segs: done < trips ? [{ from: done, to: last, s: "stop" }] : [], label };
}

export function cleanTitle(trips: number, inr: number): CleanSpecimen["title"] {
  const before = trips === 1 ? `Yesterday${APOS}s trip adds up. ` : `All ${trips} trips add up. `;
  return { before, inr, after: " earned, nothing unaccounted." };
}

export function cleanCopy(trips: number, nth: number): RichPart[] {
  return [
    { text: `Diesel, tolls and km matched on ${trips === 1 ? "the trip" : "every trip"}. That${APOS}s the ` },
    { text: `${ordinal(nth)} clean day`, bold: true },
    { text: " this month." },
  ];
}

export function emptyCopy(moving: number, parked: number, nextBrief: string): string {
  return (
    `${moving} ${plural(moving, "truck is", "trucks are")} still on the road and ${parked} ${plural(parked, "was", "were")} in the yard or workshop. ` +
    `Urja will reconcile each trip the morning after it ends. Next brief: tomorrow, ${nextBrief}.`
  );
}

export function errorCopy(lateTrucks: number, since: string, stretch: string, ready: number): string {
  const late = `${lateTrucks} ${plural(lateTrucks, `truck hasn${APOS}t`, `trucks haven${APOS}t`)} sent data since ${since}`;
  const readyLine = ready === 1 ? "The other trip is ready." : `The other ${ready} trips are ready.`;
  return (
    `${late}, most likely no mobile network on the ${stretch}. ` +
    `Nothing is lost: the devices store data and send it when they reconnect. ${readyLine}`
  );
}

/** The IST day of `t`, at `hour`:00. */
function atHour(t: Min, hour: number): Min {
  const { year, month, day: d } = minToISTParts(t);
  return istMin(year, month, d, hour);
}

// ── The specimens ────────────────────────────────────────────────────────
/**
 * The data-late specimen's assumption: the Udaipur-stretch trucks last reported at
 * 2 AM this morning (Design.md §18). Only this hour is posited; who is late, and
 * how many trips are ready, come from yesterday's trips.
 */
export const DATA_LATE_SINCE: Min = atHour(DEMO_NOW, 2);

/** The next brief: tomorrow at the message hour (7:00 AM), as it is past 7:00 now. */
const NEXT_BRIEF: Min = atHour(DEMO_NOW + MIN_PER_DAY, MESSAGE_HOUR);

/** The clean-day specimen is 24 Sep's real data (TKT-11 scope, TC-010): 17 trips, no flags. */
export const CLEAN_SPECIMEN_DAY: DayKey = "2026-09-24";

let memo: StateSpecimens | null = null;

/** Every specimen, computed once from the memoised dataset. */
export function stateSpecimens(): StateSpecimens {
  if (memo) return memo;
  const y = yesterday();
  const stretch = STRETCHES.udaipur;
  const lateTrips = y.tripIds.map(tripById).filter((t) => routeById(t.routeId).stretches.includes(stretch.id));
  const lateTrucks = new Set(lateTrips.map((t) => t.plate)).size;
  const ready = y.trips - lateTrips.length;

  const { moving, yard, workshop } = fleetNow().counts;

  const cleanKey = CLEAN_SPECIMEN_DAY;
  const c = day(cleanKey);
  const clean = cleanDays(cleanKey);
  if (c.trips === 0 || c.flags.length > 0 || clean.at(-1) !== cleanKey) throw new Error(`${cleanKey} is not a clean day`);
  const [cy, cm, cd] = cleanKey.split("-").map(Number);
  const firstTrip = [...c.tripIds].sort()[0];

  memo = {
    loading: {
      tag: `reconciling yesterday${APOS}s trips`,
      status: loadingStatus(y.trips, ready),
      rail: progressRail(y.trips, ready, `Progress: ${ready} of ${y.trips} trips checked, ${y.trips - ready} still to check`),
    },
    empty: {
      tag: "no trips finished yesterday",
      title: "No trips finished yesterday.",
      copy: emptyCopy(moving, yard + workshop, formatTimeIST(NEXT_BRIEF)),
      fleet: { text: "See where trucks are now", href: "/?view=fleet" },
      // Today's "September so far" cards (the mockup's "Open last week"; no last-week view exists).
      september: { text: "Open September so far", href: "/#month-h" },
    },
    clean: {
      dayKey: cleanKey,
      tag: `a clean day · ${formatDateIST(istMin(cy, cm, cd), "weekday-day-month")}`,
      title: cleanTitle(c.trips, c.profitInr),
      copy: cleanCopy(c.trips, clean.length),
      rail: progressRail(c.trips, c.trips, `All ${c.trips} of ${c.trips} trips checked, and every one adds up`),
      ends: [`${c.trips} ${plural(c.trips, "trip", "trips")} reconciled`, "0 flags"],
      ledger: { text: "See the ledger", href: `/trips/${firstTrip}#led-h` },
    },
    error: {
      tag: `data didn${APOS}t arrive`,
      title: `Yesterday${APOS}s trips haven${APOS}t reached Urja yet.`,
      copy: errorCopy(lateTrucks, hourLabel(DATA_LATE_SINCE), stretch.name.en, ready),
      ready: `Show the ${ready} ready ${plural(ready, "trip", "trips")}`,
      retry: "Try again",
    },
  };
  return memo;
}
