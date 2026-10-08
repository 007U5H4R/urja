import { describe, expect, it } from "vitest";
import { getTodayHead } from "@/lib/data/views/today";
import { getTripView } from "@/lib/data/views/trip";
import { getTruckView } from "@/lib/bet/views/truck";
import { FLEET } from "@/lib/data/fleet";
import { formatINR } from "@/lib/format";
import { DEMO_COPY, getDemoView } from "./demo";

// TASK-33 (EXE49): /demo, a six-step guided path. TASK-34 (EXE50): told as the story, from the
// lunch stop to the lender. Copy here; the Today, trip and lender figures come from the views.

const view = getDemoView();
const allText = () =>
  [
    DEMO_COPY.title,
    DEMO_COPY.h1,
    DEMO_COPY.description,
    ...view.story,
    view.meet,
    view.intro,
    view.close,
    ...view.steps.flatMap((s) => [s.title, s.look, s.note ?? "", s.cta]),
  ].join(" ");
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/);

describe("the guided demo", () => {
  it("has the h1, and an intro naming the prototype, the simulated fleet and the demo clock", () => {
    expect(DEMO_COPY.h1).toBe("The 3-minute demo");
    expect(view.intro).toMatch(/prototype/i);
    expect(view.intro).toMatch(/simulated/i);
    expect(view.intro).toContain("Mon 28 Sep 2026, 7:12 AM");
  });

  it("TASK-34: opens with the lunch stop in two sentences, then meets Mr. Sharma, simulated", () => {
    expect(view.story).toHaveLength(1);
    expect(view.story[0]).toMatch(/^It started with a lunch stop/);
    expect(sentences(view.story[0])).toHaveLength(2);
    for (const fact of ["Bengaluru", "Mysore", "24 trucks", "yesterday", "month end"]) expect(view.story[0]).toContain(fact);
    expect(view.meet).toBe(`Urja is built for owners like him. Meet Mr. Sharma: ${FLEET.length} trucks out of Jaipur (simulated).`);
    expect(view.meet).toContain("24 trucks");
  });

  it("TASK-34: ends with the closing line", () => {
    expect(view.close).toBe("One morning. One answer. In rupees. With evidence. And with the driver’s side of the story.");
  });

  it("walks six story steps in order, each with a title, one line and the same links", () => {
    expect(view.steps.map((s) => [s.title, s.href])).toEqual([
      ["7 AM: one message, in Hindi", "/message"],
      ["Rupees, not data", "/"],
      ["Tap for the evidence", "/trips/0926-04#flag-lab"],
      ["When the money is trusted, the record becomes credit", "/bet"],
      ["Who pays", "/bet/tiers"],
      ["What a lender sees", "/trucks/rj14-gb-4521"],
    ]);
    for (const s of view.steps) {
      expect(s.look.length, s.title).toBeGreaterThan(20);
      expect(sentences(s.look).length, s.title).toBe(1);
      expect(s.cta.length, s.title).toBeGreaterThan(0);
    }
    // Only the evidence step carries the Flag lab's instruction, as a second line.
    expect(view.steps.map((s) => s.note !== undefined)).toEqual([false, false, true, false, false, false]);
  });

  it("only the message step crosses root layouts, so only it skips the prefetch", () => {
    expect(view.steps.map((s) => s.crossLayout)).toEqual([true, false, false, false, false, false]);
  });

  it("reads Today's figures from the Today view, not typed copy", () => {
    const v = getTodayHead().verdict;
    const today = view.steps[1].look;
    expect(today).toContain(formatINR(v.earnedInr));
    expect(today).toContain(formatINR(v.unaccountedInr));
    expect(today).toContain(`${v.flaggedTrips} trips`);
    expect(today).toContain("doesn’t add up");
    // The fixed numbers (HANDOFF.md).
    expect(today).toContain("₹1,86,400");
    expect(today).toContain("₹11,430");
  });

  it("TASK-34: the evidence line matches trip 0926-04's view: plate, place, time, litres, minutes and rupees", () => {
    const trip = getTripView("0926-04")!;
    if (trip.card.kind !== "flag") throw new Error("0926-04 should carry a flag");
    const flag = trip.card.flag;
    const look = view.steps[2].look;
    expect(look).toContain(trip.head.plate);
    expect(look).toContain(formatINR(flag.inr));
    expect(flag.driverSide.message).toContain("near Behror at 2:14 AM");
    expect(flag.evidence[0].text).toBe("Fuel fell 168 → 130 L in 26 minutes");
    expect(trip.timeline.some((e) => e.t === "2:14 AM" && e.v === "−38 L")).toBe(true);
    // The fixed numbers (the story's brief).
    expect(look).toBe(
      "At 2:14 AM, RJ14 GB 4521 was parked near Behror with the ignition off, and the tank dropped 38 L in 26 minutes, about ₹3,420; Urja says it doesn’t add up, and the driver gets to explain.",
    );
  });

  it("reads the lender view's verified days from the truck view, and says there are no projections", () => {
    const lender = view.steps[5].look;
    expect(lender).toContain(getTruckView("rj14-gb-4521")!.verified.text);
    expect(lender).toContain("27 of 180 verified days");
    expect(lender).toMatch(/no projections/i);
  });

  it("tells the visitor what to do on the message and the Flag lab (the instruction kept word for word)", () => {
    expect(view.steps[0].look).toMatch(/Hindi/);
    expect(view.steps[0].look).toMatch(/EN/);
    expect(view.steps[2].note).toBe(
      "The Flag lab opens on step 4, High on one family; step to 5, the simulated camera, for a second family, then switch to Autopilot and L4’s auto-hold becomes available.",
    );
  });

  it("the bet step says the trusted record becomes credit, with consent", () => {
    expect(view.steps[3].look).toMatch(/verified truck-months/);
    expect(view.steps[3].look).toMatch(/consent/);
  });

  it("is English only, with none of the banned words; ₹ appears only in the computed Today and evidence lines", () => {
    const text = allText();
    expect(text).not.toMatch(/[ऀ-ॿ]/);
    expect(text).not.toMatch(/theft|stolen|steal|thief|चोरी/i);
    const copyOnly = [
      DEMO_COPY.title,
      DEMO_COPY.h1,
      DEMO_COPY.description,
      ...view.story,
      view.meet,
      view.close,
      ...view.steps.filter((_, i) => i !== 1 && i !== 2).map((s) => s.look),
      view.steps[2].note ?? "",
    ].join(" ");
    expect(copyOnly).not.toMatch(/₹/);
  });
});
