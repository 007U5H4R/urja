/**
 * Per-page titles and descriptions (technical-plan §9). Pages import these so that no
 * ₹ amount is typed in app/; every number is read from the data engine.
 * /brief and /message take their (language-aware) titles from the TKT-06 templates.
 */
import type { Metadata } from "next";
import { WHY_TITLE } from "@/content/why";
import type { Lang } from "@/lib/brief/dict";
import { renderBrief, renderMessage } from "@/lib/brief/template";
import { DEMO_NOW, MIN_PER_DAY } from "@/lib/clock";
import { YESTERDAY_DAY } from "@/lib/data/aggregates";
import { getTripView } from "@/lib/data/views/trip";
import { getTodayHead } from "@/lib/data/views/today";
import { formatDateIST, formatINR } from "@/lib/format";
import { pageMetadata } from "@/lib/og";
import { SHELL } from "@/lib/site-shell";

function verdict() {
  const v = getTodayHead().verdict;
  return {
    day: formatDateIST(DEMO_NOW - MIN_PER_DAY, "weekday-day-month"),
    earned: formatINR(v.earnedInr),
    unaccounted: formatINR(v.unaccountedInr),
    trips: `${v.flaggedTrips} ${v.flaggedTrips === 1 ? "trip" : "trips"}`,
  };
}

export function todayMetadata(): Metadata {
  const v = verdict();
  return pageMetadata({
    title: { absolute: `Today · Urja — ${SHELL.fleetName}` },
    description: `${SHELL.fleetName}, ${v.day}: the trucks earned ${v.earned}, and ${v.unaccounted} of it doesn’t add up, across ${v.trips}.`,
    path: "/",
  });
}

export function whyMetadata(): Metadata {
  return pageMetadata({
    title: { absolute: WHY_TITLE },
    description:
      "Fleet owners learn where their money leaked at month end. Urja tells them the next morning. What the concept is, and what in this prototype is simulated.",
    path: "/why",
  });
}

/** Null for an id with no trip page. */
export function tripMetadata(tripId: string): Metadata | null {
  const v = getTripView(tripId);
  if (!v) return null;
  const card = v.card.kind === "flag" ? v.card.flag.title : v.card.title;
  const vs = v.head.result.kind === "profit" ? `, ${v.head.result.vs.sentence}` : "";
  return pageMetadata({
    title: { absolute: v.title },
    description: `${v.head.plate} · ${v.head.route}: ${card}${vs}.`,
    path: `/trips/${v.id}`,
  });
}

/** `lang` is the page's `?lang=` (Hindi by default); the title follows it. */
export function briefMetadata(lang: Lang = "hi"): Metadata {
  const v = verdict();
  return pageMetadata({
    title: { absolute: renderBrief(YESTERDAY_DAY, lang).title },
    description: `The morning hisaab for ${SHELL.fleetName}, in Hindi or English: ${v.earned} earned on ${v.day}, and the ${v.trips} where ${v.unaccounted} doesn’t add up.`,
    path: "/brief",
  });
}

export function messageMetadata(lang: Lang = "hi"): Metadata {
  const v = verdict();
  return pageMetadata({
    title: { absolute: renderMessage(YESTERDAY_DAY, lang).title },
    description: `The 7 AM WhatsApp message Urja sends the owner of ${SHELL.fleetName}: ${v.earned} earned on ${v.day}; ${v.unaccounted} doesn’t add up, across ${v.trips}.`,
    path: "/message",
  });
}
