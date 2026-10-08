import { describe, expect, it } from "vitest";
import { getTodayHead } from "@/lib/data/views/today";
import { getTruckView } from "@/lib/bet/views/truck";
import { formatINR } from "@/lib/format";
import { DEMO_COPY, getDemoView } from "./demo";

// TASK-33 (EXE49): /demo, a six-step guided path. Copy here; the Today and lender figures come
// from the views, never typed.

const view = getDemoView();
const allText = () =>
  [DEMO_COPY.title, DEMO_COPY.h1, DEMO_COPY.description, view.intro, ...view.steps.flatMap((s) => [s.title, s.look, s.cta])].join(" ");

describe("the guided demo", () => {
  it("has the h1, and an intro naming the prototype, the simulated fleet and the demo clock", () => {
    expect(DEMO_COPY.h1).toBe("The 3-minute demo");
    expect(view.intro).toMatch(/prototype/i);
    expect(view.intro).toMatch(/simulated/i);
    expect(view.intro).toContain("Mon 28 Sep 2026, 7:12 AM");
  });

  it("walks six steps in order, each with a title, one line and a link", () => {
    expect(view.steps.map((s) => [s.title, s.href])).toEqual([
      ["The 7 AM message", "/message"],
      ["Today", "/"],
      ["A flagged trip and the Flag lab", "/trips/0926-04#flag-lab"],
      ["The bet", "/bet"],
      ["Tiers and who pays", "/bet/tiers"],
      ["The lender view", "/trucks/rj14-gb-4521"],
    ]);
    for (const s of view.steps) {
      expect(s.look.length, s.title).toBeGreaterThan(20);
      expect(s.look.split(/(?<=[.!?])\s+/).length, s.title).toBe(1);
      expect(s.cta.length, s.title).toBeGreaterThan(0);
    }
  });

  it("only the message step crosses root layouts, so only it skips the prefetch", () => {
    expect(view.steps.map((s) => s.crossLayout)).toEqual([true, false, false, false, false, false]);
  });

  it("reads Today's figures from the Today view, not typed copy", () => {
    const v = getTodayHead().verdict;
    const today = view.steps[1].look;
    expect(today).toContain(formatINR(v.earnedInr));
    expect(today).toContain(formatINR(v.unaccountedInr));
    expect(today).toContain(`${v.flaggedTrips} flagged trips`);
    expect(today).toContain("doesn’t add up");
    // The fixed numbers (HANDOFF.md).
    expect(today).toContain("₹1,86,400");
    expect(today).toContain("₹11,430");
  });

  it("reads the lender view's verified days from the truck view, and says there are no projections", () => {
    const lender = view.steps[5].look;
    expect(lender).toContain(getTruckView("rj14-gb-4521")!.verified.text);
    expect(lender).toContain("27 of 180 verified days");
    expect(lender).toMatch(/no projections/i);
  });

  it("tells the visitor what to do on the message and the Flag lab", () => {
    expect(view.steps[0].look).toMatch(/Hindi/);
    expect(view.steps[0].look).toMatch(/EN/);
    expect(view.steps[2].look).toMatch(/High/);
    expect(view.steps[2].look).toMatch(/Autopilot/);
    expect(view.steps[2].look).toMatch(/L4/);
    expect(view.steps[2].look).toMatch(/step to 5/);
    expect(view.steps[2].look).toMatch(/simulated/i);
  });

  it("is English only, with none of the banned words; ₹ appears only in the computed Today line", () => {
    const text = allText();
    expect(text).not.toMatch(/[ऀ-ॿ]/);
    expect(text).not.toMatch(/theft|stolen|steal|thief|चोरी/i);
    const copyOnly = [DEMO_COPY.title, DEMO_COPY.h1, DEMO_COPY.description, ...view.steps.filter((_, i) => i !== 1).map((s) => s.look)].join(" ");
    expect(copyOnly).not.toMatch(/₹/);
  });
});
