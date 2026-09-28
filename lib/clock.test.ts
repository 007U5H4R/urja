import { describe, expect, it } from "vitest";
import { DEMO_NOW, MIN_PER_DAY, SEPT_END_EXCL, SEPT_START, dayKey, istMin } from "./clock";
import { EPOCH_UTC_MS } from "./format";

describe("demo clock", () => {
  it("DEMO_NOW is Mon 28 Sep 2026, 7:12 AM IST", () => {
    expect(DEMO_NOW).toBe(30 * 1440 + 7 * 60 + 12);
    expect(EPOCH_UTC_MS + DEMO_NOW * 60_000).toBe(Date.parse("2026-09-28T07:12:00+05:30"));
  });

  it("brackets September 1–27 in IST", () => {
    expect(SEPT_START).toBe(3 * MIN_PER_DAY);
    expect(SEPT_END_EXCL).toBe(30 * MIN_PER_DAY);
    expect(EPOCH_UTC_MS + SEPT_START * 60_000).toBe(Date.parse("2026-09-01T00:00:00+05:30"));
    expect(EPOCH_UTC_MS + SEPT_END_EXCL * 60_000).toBe(Date.parse("2026-09-28T00:00:00+05:30"));
  });

  it("istMin converts an IST wall time to minutes since EPOCH", () => {
    expect(istMin(2026, 8, 29)).toBe(0);
    expect(istMin(2026, 9, 28, 7, 12)).toBe(DEMO_NOW);
    // Trip 0926-04 departs Sat 26 Sep, 9:05 PM.
    expect(istMin(2026, 9, 26, 21, 5)).toBe(28 * MIN_PER_DAY + 21 * 60 + 5);
  });

  it("dayKey of trip 0926-04's end (Sun 27 Sep, 6:40 AM IST) is 2026-09-27", () => {
    const t0 = istMin(2026, 9, 26, 21, 5);
    expect(dayKey(t0 + 575)).toBe("2026-09-27");
    expect(dayKey(t0)).toBe("2026-09-26");
  });

  it("dayKey flips exactly at IST midnight, not UTC midnight", () => {
    const midnight = istMin(2026, 9, 27);
    expect(dayKey(midnight - 1)).toBe("2026-09-26");
    expect(dayKey(midnight)).toBe("2026-09-27");
    expect(dayKey(SEPT_START)).toBe("2026-09-01");
    expect(dayKey(SEPT_END_EXCL - 1)).toBe("2026-09-27");
    expect(dayKey(DEMO_NOW)).toBe("2026-09-28");
    expect(dayKey(0)).toBe("2026-08-29");
    expect(dayKey(-0.5)).toBe("2026-08-28");
    expect(dayKey(-1)).toBe("2026-08-28");
    expect(dayKey(-1441)).toBe("2026-08-27");
  });
});
