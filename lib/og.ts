/**
 * Link-preview data (technical-plan §9, TKT-09): the Open Graph / Twitter set every page
 * carries, and the /og-card view that `scripts/render-og.ts` screenshots into public/og.png.
 * Every number here comes from the TripView and flag of 0926-04, never from typed copy.
 */
import type { Metadata } from "next";
import { flagsForTrip } from "@/lib/data/aggregates";
import { placeById } from "@/lib/data/places";
import { REFUEL_RAMP_MIN } from "@/lib/data/simulate";
import { getTripView, type WaveKind } from "@/lib/data/views/trip";
import { formatINR, formatLitres, formatTimeIST } from "@/lib/format";
import { siteUrl } from "@/lib/site";

export const SITE_NAME = "Urja";
export const SITE_DESCRIPTION = "An AI munshi for Indian fleet owners · a concept for Bytebeam";
export const TITLE_TEMPLATE = `%s · ${SITE_NAME}`;
/** The trip the OG image is about (Flag 1 in HANDOFF's fixed numbers). */
export const OG_TRIP_ID = "0926-04";
export const OG_HEADLINE = "Where did the diesel go?";

interface OgFacts {
  plate: string;
  litres: string;
  place: string;
  time: string;
  inr: number;
}

let facts: OgFacts | null = null;

/** Plate, ₹ and litres from the TripView; place and time from its primary flag. */
function ogFacts(): OgFacts {
  if (facts) return facts;
  const v = getTripView(OG_TRIP_ID);
  const flag = flagsForTrip(OG_TRIP_ID)[0];
  if (!v || v.card.kind !== "flag" || !flag?.placeId) throw new Error(`OG trip ${OG_TRIP_ID} has no located flag`);
  facts = {
    plate: v.head.plate,
    litres: formatLitres(flag.litres ?? 0),
    place: placeById(flag.placeId).name.en,
    time: formatTimeIST(flag.at),
    inr: v.card.flag.inr,
  };
  return facts;
}

/** "Where did the diesel go? RJ14 GB 4521 lost 38 L near Behror at 2:14 AM — ₹3,420" */
export function ogImageAlt(): string {
  const f = ogFacts();
  return `${OG_HEADLINE} ${f.plate} lost ${f.litres} near ${f.place} at ${f.time} — ${formatINR(f.inr)}`;
}

/** The static preview image every page points at. */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: ogImageAlt() } as const;

// ── /og-card ─────────────────────────────────────────────────────────────
export type FuelDropKind = "dim" | "loss" | "hot";

export interface FuelDropSeries {
  fuel: number[];
  speed: number[];
  kind: FuelDropKind[];
  /** First and last red bar (the shaded drop), or null on a clean trip. */
  window: [number, number] | null;
  /** Scale top for fuel: just above the peak, rounded up to 10 L. */
  max: number;
  /** Scale top for speed (at least 60 km/h, as in the mockup). */
  speedMax: number;
}

type WaveInput = { fuel: readonly number[]; speed: readonly number[]; kind: readonly WaveKind[]; step: number };

/**
 * The OG mini chart: the trip's wave squeezed into at most `bars` equal time buckets.
 * A bucket shows its first reading (the last bucket its final one, so the chart ends where
 * the trip did); a bucket holding the drop is red and shows the lowest reading inside the
 * drop; the bucket holding the refuel is the one lit bar and shows the tank's peak after
 * the fill (its ramp can spill into the next samples). Speed follows the same reading
 * (the lowest inside the drop, the one at the refuel).
 */
export function fuelDropSeries(wave: WaveInput, bars: number): FuelDropSeries {
  const n = wave.fuel.length;
  const k = Math.max(1, Math.ceil(n / bars));
  const count = Math.ceil(n / k);
  const ramp = Math.ceil(REFUEL_RAMP_MIN / wave.step);
  const fuel: number[] = [], speed: number[] = [], kind: FuelDropKind[] = [];
  for (let b = 0; b < count; b++) {
    const from = b * k, to = Math.min(n, from + k); // [from, to)
    const idx = Array.from({ length: to - from }, (_, j) => from + j);
    const at = b === count - 1 ? to - 1 : from;
    const drop = idx.filter((i) => wave.kind[i] === "flag");
    const fill = idx.find((i) => wave.kind[i] === "fuel");
    if (drop.length) {
      kind.push("loss");
      fuel.push(Math.min(...drop.map((i) => wave.fuel[i])));
      speed.push(Math.min(...drop.map((i) => wave.speed[i])));
    } else if (fill !== undefined) {
      kind.push("hot");
      fuel.push(Math.max(...wave.fuel.slice(from, Math.min(n, to + ramp))));
      speed.push(wave.speed[fill]);
    } else {
      kind.push("dim");
      fuel.push(wave.fuel[at]);
      speed.push(wave.speed[at]);
    }
  }
  const loss = kind.flatMap((x, i) => (x === "loss" ? [i] : []));
  return {
    fuel,
    speed,
    kind,
    window: loss.length ? [loss[0], loss[loss.length - 1]] : null,
    max: Math.ceil((Math.max(...fuel) * 1.05) / 10) * 10,
    speedMax: Math.max(60, ...speed),
  };
}

export interface OgCardView {
  brand: string;
  headline: string;
  plate: string;
  /** "38 L unaccounted near Behror, 2:14 AM" */
  what: string;
  inr: number;
  foot: string;
  fuel: FuelDropSeries;
  /** The trip chart's own aria-label: the whole story in words. */
  chartLabel: string;
}

/** Bars in the OG mini chart (og/index.html draws 24). */
export const OG_BARS = 24;

export function getOgCard(): OgCardView {
  const f = ogFacts();
  const v = getTripView(OG_TRIP_ID)!;
  return {
    brand: SITE_NAME,
    headline: OG_HEADLINE,
    plate: f.plate,
    what: `${f.litres} unaccounted near ${f.place}, ${f.time}`,
    inr: f.inr,
    foot: SITE_DESCRIPTION,
    fuel: fuelDropSeries(v.chart.desk, OG_BARS),
    chartLabel: v.chart.label,
  };
}

// ── Metadata builders ────────────────────────────────────────────────────
const OG_BASE = { type: "website", siteName: SITE_NAME } as const;
const TWITTER_BASE = { card: "summary_large_image" } as const;

/** app/layout.tsx: metadataBase, the title template and the site-wide defaults. */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: { default: SITE_NAME, template: TITLE_TEMPLATE },
    description: SITE_DESCRIPTION,
    openGraph: { ...OG_BASE, title: SITE_NAME, description: SITE_DESCRIPTION, images: [OG_IMAGE] },
    twitter: { ...TWITTER_BASE, title: SITE_NAME, description: SITE_DESCRIPTION, images: [OG_IMAGE] },
  };
}

export interface PageMeta {
  /** A plain title goes through the template ("Morning · Urja"); `absolute` is used as is. */
  title: string | { absolute: string };
  description: string;
  /** The route, resolved against metadataBase into og:url and the canonical link. */
  path: string;
}

/**
 * One page's metadata with the full OG and Twitter set. Next replaces a parent's
 * `openGraph` / `twitter` object wholesale, so every page repeats the type, site name and image.
 */
export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  const full = typeof title === "string" ? TITLE_TEMPLATE.replace("%s", title) : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_BASE, title: full, description, url: path, images: [OG_IMAGE] },
    twitter: { ...TWITTER_BASE, title: full, description, images: [OG_IMAGE] },
  };
}
