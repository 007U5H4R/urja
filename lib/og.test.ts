import { describe, expect, it } from "vitest";
import { getTripView } from "@/lib/data/views/trip";
import {
  OG_HEADLINE,
  OG_IMAGE,
  OG_TRIP_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  fuelDropSeries,
  getOgCard,
  ogImageAlt,
  pageMetadata,
  rootMetadata,
} from "./og";
import { siteUrl } from "./site";

describe("OG image copy (technical-plan §9)", () => {
  it("builds the §9 alt text from the 0926-04 flag", () => {
    expect(ogImageAlt()).toBe("Where did the diesel go? RJ14 GB 4521 lost 38 L near Behror at 2:14 AM — ₹3,420");
  });

  it("describes the image as a static 1200×630 /og.png", () => {
    expect(OG_IMAGE).toEqual({ url: "/og.png", width: 1200, height: 630, alt: ogImageAlt() });
  });

  it("gives the /og-card view the mockup's fragments, computed from data", () => {
    const c = getOgCard();
    expect(c.brand).toBe(SITE_NAME);
    expect(c.headline).toBe(OG_HEADLINE);
    expect(c.headline).toBe("Where did the diesel go?");
    expect(c.plate).toBe("RJ14 GB 4521");
    expect(c.what).toBe("38 L unaccounted near Behror, 2:14 AM");
    expect(c.inr).toBe(3420);
    expect(c.foot).toBe("An AI munshi for Indian fleet owners · a concept for Bytebeam");
    expect(c.chartLabel).toBe(getTripView(OG_TRIP_ID)!.chart.label);
  });
});

describe("fuelDropSeries: the OG mini chart from the trip's wave", () => {
  const v = getTripView(OG_TRIP_ID)!;
  const s = fuelDropSeries(v.chart.desk, 24);

  it("has 24 bars from the trip's start to its end", () => {
    expect(s.fuel).toHaveLength(24);
    expect(s.speed).toHaveLength(24);
    expect(s.kind).toHaveLength(24);
    expect(s.fuel[0]).toBe(v.chart.desk.fuel[0]);
    expect(Math.round(s.fuel.at(-1)!)).toBe(230);
  });

  it("shades the drop red, ending at 130 L with the truck parked", () => {
    const loss = s.kind.flatMap((k, i) => (k === "loss" ? [i] : []));
    expect(loss.length).toBeGreaterThanOrEqual(1);
    expect(s.window).toEqual([loss[0], loss.at(-1)]);
    expect(loss).toEqual(Array.from({ length: loss.length }, (_, j) => loss[0] + j)); // contiguous
    const before = s.fuel[loss[0] - 1];
    expect(before - s.fuel[loss.at(-1)!]).toBeGreaterThan(30);
    expect(Math.round(Math.min(...loss.map((i) => s.fuel[i])))).toBe(130);
  });

  it("lights exactly one refuel bar, at the tank's peak after the fill", () => {
    const hot = s.kind.flatMap((k, i) => (k === "hot" ? [i] : []));
    expect(hot).toHaveLength(1);
    expect(hot[0]).toBeGreaterThan(s.window![1]);
    expect(s.fuel[hot[0]]).toBe(Math.max(...s.fuel));
    expect(s.fuel[hot[0]]).toBeGreaterThan(250);
  });

  it("keeps every other bar dim and scales the axis just above the peak", () => {
    expect(s.kind.filter((k) => k === "dim")).toHaveLength(24 - s.kind.filter((k) => k !== "dim").length);
    expect(s.max).toBeGreaterThan(Math.max(...s.fuel));
    expect(s.max).toBeLessThanOrEqual(Math.max(...s.fuel) * 1.1);
    expect(s.speedMax).toBeGreaterThanOrEqual(Math.max(...s.speed));
  });

  it("has no window and no hot bar on a clean series", () => {
    const flat = fuelDropSeries({ fuel: [100, 99, 98, 97], speed: [40, 40, 40, 40], kind: ["move", "move", "move", "move"], step: 5 }, 2);
    expect(flat.window).toBeNull();
    expect(flat.kind).toEqual(["dim", "dim"]);
    expect(flat.fuel).toEqual([100, 97]);
  });
});

describe("page metadata builders", () => {
  it("roots the site: metadataBase, title template, description, OG and Twitter defaults", () => {
    const m = rootMetadata();
    expect(String(m.metadataBase)).toBe(`${siteUrl}/`);
    expect(m.title).toEqual({ default: SITE_NAME, template: "%s · Urja" });
    expect(m.description).toBe(SITE_DESCRIPTION);
    expect(m.openGraph).toMatchObject({ type: "website", siteName: "Urja", images: [OG_IMAGE] });
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: [OG_IMAGE] });
  });

  it("repeats the whole OG and Twitter set per page (Next replaces, not merges, openGraph)", () => {
    const m = pageMetadata({ title: "Morning", description: "d", path: "/brief" });
    expect(m.title).toBe("Morning");
    expect(m.description).toBe("d");
    expect(m.alternates).toEqual({ canonical: "/brief" });
    expect(m.openGraph).toEqual({
      type: "website",
      siteName: "Urja",
      title: "Morning · Urja",
      description: "d",
      url: "/brief",
      images: [OG_IMAGE],
    });
    expect(m.twitter).toEqual({ card: "summary_large_image", title: "Morning · Urja", description: "d", images: [OG_IMAGE] });
  });

  it("uses an absolute title as is", () => {
    const m = pageMetadata({ title: { absolute: "Why Urja · a concept for Bytebeam" }, description: "d", path: "/why" });
    expect(m.title).toEqual({ absolute: "Why Urja · a concept for Bytebeam" });
    expect(m.openGraph).toMatchObject({ title: "Why Urja · a concept for Bytebeam" });
  });
});
