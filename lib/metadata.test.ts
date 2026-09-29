import { describe, expect, it } from "vitest";
import { briefMetadata, messageMetadata, todayMetadata, tripMetadata, whyMetadata } from "./metadata";
import { OG_IMAGE } from "./og";

const og = (m: { openGraph?: unknown }) => m.openGraph as Record<string, unknown>;

describe("per-page metadata (technical-plan §9)", () => {
  it("Today: the mockup title and yesterday's verdict, computed", () => {
    const m = todayMetadata();
    expect(m.title).toEqual({ absolute: "Today · Urja — Sharma Roadlines" });
    expect(m.description).toBe(
      "Sharma Roadlines, Sun 27 Sep: the trucks earned ₹1,86,400, and ₹11,430 of it doesn’t add up, across 3 trips.",
    );
    expect(og(m)).toMatchObject({ url: "/", title: "Today · Urja — Sharma Roadlines", images: [OG_IMAGE] });
  });

  it("Why Urja: the §9 title", () => {
    const m = whyMetadata();
    expect(m.title).toEqual({ absolute: "Why Urja · a concept for Bytebeam" });
    expect(og(m)).toMatchObject({ url: "/why", title: "Why Urja · a concept for Bytebeam" });
    expect(m.description).toMatch(/simulated/);
  });

  it("Trip 0926-04: the TripView title and the flag in the description", () => {
    const m = tripMetadata("0926-04")!;
    expect(m.title).toEqual({ absolute: "Trip 0926-04 · Urja — Sharma Roadlines" });
    expect(m.description).toBe(
      "RJ14 GB 4521 · Jaipur → Delhi (Okhla): 38 L diesel unaccounted, ₹3,420 below this route’s normal of ₹16,660.",
    );
    expect(og(m)).toMatchObject({ url: "/trips/0926-04", images: [OG_IMAGE] });
  });

  it("returns null for an unknown trip", () => {
    expect(tripMetadata("nope")).toBeNull();
  });

  it("Brief and message: the TKT-06 titles per language, numbers from data", () => {
    const b = briefMetadata();
    expect(b.title).toEqual({ absolute: "सुबह का हिसाब · Urja" });
    expect(og(briefMetadata("en"))).toMatchObject({ url: "/brief", title: "Morning brief · Urja" });
    expect(og(b)).toMatchObject({ url: "/brief", title: "सुबह का हिसाब · Urja" });
    expect(b.description).toContain("₹1,86,400");
    expect(b.description).toContain("₹11,430");
    const m = messageMetadata();
    expect(m.title).toEqual({ absolute: "सुबह 7 बजे का संदेश · Urja" });
    expect(og(messageMetadata("en"))).toMatchObject({ url: "/message", title: "7 AM message · Urja" });
    expect(og(m)).toMatchObject({ url: "/message", title: "सुबह 7 बजे का संदेश · Urja" });
    expect(m.description).toContain("₹11,430");
  });

  it("never uses the banned words", () => {
    const all = [todayMetadata(), whyMetadata(), tripMetadata("0926-04")!, briefMetadata(), messageMetadata()];
    const text = JSON.stringify(all);
    expect(text).not.toMatch(/theft|stolen|stole|thief|चोरी|चुराया|चोर/i);
  });
});
