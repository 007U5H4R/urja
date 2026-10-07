import { describe, expect, it } from "vitest";
import { BET_OVERVIEW, BET_TIERS } from "@/content/bet/copy";
import {
  betMetadata,
  betTiersMetadata,
  briefMetadata,
  messageMetadata,
  todayMetadata,
  tripMetadata,
  truckMetadata,
  whyMetadata,
} from "./metadata";
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

  it("The bet (TASK-21): its title, the product line's promise, and the simulated note", () => {
    const m = betMetadata();
    expect(m.title).toEqual({ absolute: "The bet: Munshi → credit · Urja" });
    expect(m.title).toEqual({ absolute: BET_OVERVIEW.title });
    expect(og(m)).toMatchObject({ url: "/bet", title: BET_OVERVIEW.title, images: [OG_IMAGE] });
    expect(m.description).toBe(BET_OVERVIEW.description);
    expect(m.description).toMatch(/simulated/);
    expect(m.alternates).toEqual({ canonical: "/bet" });
  });

  it("Tiers (TASK-21): its title and description", () => {
    const m = betTiersMetadata();
    expect(m.title).toEqual({ absolute: "Tiers and who pays · Urja" });
    expect(og(m)).toMatchObject({ url: "/bet/tiers", title: "Tiers and who pays · Urja", images: [OG_IMAGE] });
    expect(m.description).toBe(BET_TIERS.description);
  });

  it("Truck RJ14 GB 4521 (TASK-21): September profit and ₹/km from its trucks() row", () => {
    const m = truckMetadata("RJ14 GB 4521")!;
    expect(m.title).toEqual({ absolute: "Truck RJ14 GB 4521 · Urja — Sharma Roadlines" });
    expect(m.description).toBe(
      "RJ14 GB 4521 · Ramesh Kumar: ₹97,848 profit in September over 6,480 km, ₹15.1 per km, rank 23 of 24. The record a lender could finance against, on simulated data.",
    );
    expect(og(m)).toMatchObject({ url: "/trucks/rj14-gb-4521", images: [OG_IMAGE] });
    expect(m.alternates).toEqual({ canonical: "/trucks/rj14-gb-4521" });
  });

  it("Truck RJ14 GC 7710: the best truck, numbers from data", () => {
    expect(truckMetadata("RJ14 GC 7710")!.description).toBe(
      "RJ14 GC 7710 · Mahesh Meena: ₹2,17,512 profit in September over 6,840 km, ₹31.8 per km, rank 1 of 24. The record a lender could finance against, on simulated data.",
    );
  });

  it("returns null for a plate outside the fleet", () => {
    expect(truckMetadata("XX 00 ZZ 0000")).toBeNull();
  });

  it("never uses the banned words", () => {
    const all = [
      todayMetadata(),
      whyMetadata(),
      tripMetadata("0926-04")!,
      briefMetadata(),
      messageMetadata(),
      betMetadata(),
      betTiersMetadata(),
      truckMetadata("RJ14 GB 4521")!,
    ];
    const text = JSON.stringify(all);
    expect(text).not.toMatch(/theft|stolen|stole|thief|चोरी|चुराया|चोर/i);
  });
});
