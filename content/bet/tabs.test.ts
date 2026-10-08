import { describe, expect, it } from "vitest";
import { BET_TABS, BET_TABS_LABEL, betTabForPath } from "./tabs";

// TASK-32 (EXE49): the bet's tab bar: seven tabs, one route each, and which one a path is under.

describe("TASK-32 · the bet's tabs", () => {
  it("lists the seven tabs in order, each with its route", () => {
    expect(BET_TABS.map((t) => [t.label, t.href])).toEqual([
      ["Overview", "/bet"],
      ["Where we play", "/bet/market"],
      ["Product", "/bet/product"],
      ["Tiers", "/bet/tiers"],
      ["Lender view", "/trucks/rj14-gb-4521"],
      ["Plan", "/bet/plan"],
      ["Artifacts", "/bet/artifacts"],
    ]);
    expect(BET_TABS_LABEL).toBe("The bet");
    expect(new Set(BET_TABS.map((t) => t.id)).size).toBe(7);
  });

  it("gives every tab but the overview a one-line summary for the overview's cards", () => {
    for (const t of BET_TABS) {
      expect(t.summary.trim(), t.id).not.toBe("");
      expect(t.summary, t.id).not.toMatch(/\n/);
      expect(t.summary.length, t.id).toBeLessThanOrEqual(110);
    }
    expect(BET_TABS.find((t) => t.id === "artifacts")?.summary).toBe(
      "The strategy doc, PRD, deck, pitch script, research report, bet spec and decisions log.",
    );
  });

  it.each([
    ["/bet", "overview"],
    ["/bet/", "overview"],
    ["/bet/market", "market"],
    ["/bet/product", "product"],
    ["/bet/tiers", "tiers"],
    ["/bet/plan", "plan"],
    ["/bet/artifacts", "artifacts"],
    ["/trucks/rj14-gb-4521", "lender"],
    ["/trucks/rj14-gc-7710", "lender"],
    ["/trucks/rj14-gc-7710/", "lender"],
  ])("%s is under the %s tab", (path, id) => {
    expect(betTabForPath(path)).toBe(id);
  });

  it.each(["/", "/why", "/betx", "/trucks", "/bet/unknown", "/trips/0926-04"])("%s is under no tab", (path) => {
    expect(betTabForPath(path)).toBeNull();
  });
});
