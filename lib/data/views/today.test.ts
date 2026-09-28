import { describe, expect, it } from "vitest";
import { ledgerParts } from "./today";

const costs = (d: number, t: number, o: number) => [
  { key: "diesel" as const, inr: d },
  { key: "tolls" as const, inr: t },
  { key: "other" as const, inr: o },
];
const pcts = (freight: number, d: number, t: number, o: number, p: number) => ledgerParts(freight, costs(d, t, o), p).map((x) => x.pct);

describe("ledgerParts", () => {
  it("rounds costs to 0.1% and gives profit the remainder", () => {
    expect(pcts(412_000, 158_300, 38_900, 28_400, 186_400)).toEqual([38.4, 9.4, 6.9, 45.3]);
  });

  it("returns all zeros when freight is 0", () => {
    expect(pcts(0, 100, 50, 0, -150)).toEqual([0, 0, 0, 0]);
  });

  it("scales costs to fill the bar and shows no profit when costs exceed freight", () => {
    const p = pcts(1_000, 900, 300, 300, -500);
    expect(p[3]).toBe(0);
    expect(Math.round(p.reduce((a, x) => a + x * 10, 0))).toBe(1000);
    expect(p).toEqual([60, 20, 20, 0]);
  });

  it("never returns a negative width", () => {
    const p = pcts(1_000, -200, 100, 100, 1_000);
    expect(p.every((x) => x >= 0)).toBe(true);
    expect(Math.round(p.reduce((a, x) => a + x * 10, 0))).toBe(1000);
  });

  it("keeps the ₹ amounts as given, even when a width is clamped", () => {
    expect(ledgerParts(1_000, costs(900, 300, 300), -500).map((x) => x.inr)).toEqual([900, 300, 300, -500]);
  });
});
