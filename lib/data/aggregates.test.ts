import { describe, expect, it } from "vitest";
import { gapOf, truckDiesel, trucks } from "./aggregates";

describe("aggregate guards", () => {
  it("truckDiesel throws on an unknown plate", () => {
    expect(() => truckDiesel("RJ14 ZZ 0000")).toThrow(/Unknown plate/);
  });

  it("gapOf returns no gap when the fleet fits the top 5 and bottom 3", () => {
    const rows = trucks();
    expect(gapOf(rows.slice(0, 8))).toEqual({ count: 0, range: null });
    expect(gapOf(rows.slice(0, 3))).toEqual({ count: 0, range: null });
    expect(gapOf(rows.slice(0, 9))).toEqual({ count: 1, range: [rows[5].perKm, rows[5].perKm] });
  });
});
