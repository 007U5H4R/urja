import { describe, expect, it } from "vitest";
import {
  EPOCH_UTC_MS,
  formatDateIST,
  formatINR,
  formatLitres,
  formatTimeIST,
  minToISTParts,
} from "./format";

const DAY = 1440;
// Minutes since EPOCH (2026-08-29T00:00+05:30) for a given IST date and time.
const at = (dayOffset: number, h: number, m: number) => dayOffset * DAY + h * 60 + m;
const SEP_27 = 29; // 29 Aug + 29 days = 27 Sep
const SEP_28 = 30; // demo day

describe("format", () => {
  it("groups rupees the Indian way", () => {
    expect(formatINR(186400)).toBe("₹1,86,400");
    expect(formatINR(-10620)).toBe("−₹10,620");
    expect(formatINR(3420)).toBe("₹3,420");
  });

  it("uses U+2212 for negatives, never a hyphen", () => {
    const s = formatINR(-10620);
    expect(s.charCodeAt(0)).toBe(0x2212);
    expect(s).not.toContain("-");
  });

  it("formats zero, small, crore-sized and sign-never values", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(-0)).toBe("₹0");
    expect(formatINR(90)).toBe("₹90");
    expect(formatINR(12345678)).toBe("₹1,23,45,678");
    expect(formatINR(-10620, { sign: "never" })).toBe("₹10,620");
    expect(formatINR(-10620, { sign: "auto" })).toBe("−₹10,620");
  });

  it("rounds half away from zero symmetrically", () => {
    expect(formatINR(-10620.5)).toBe("−₹10,621");
    expect(formatINR(10620.5)).toBe("₹10,621");
  });

  it("throws on non-finite rupees", () => {
    expect(() => formatINR(Number.NaN)).toThrow();
    expect(() => formatINR(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => formatINR(Number.NEGATIVE_INFINITY)).toThrow();
  });

  it("formats negative litres with U+2212 and never shows −0", () => {
    expect(formatLitres(-12)).toBe("−12 L");
    expect(formatLitres(-0.3)).toBe("0 L");
    expect(formatLitres(-0.001, 2)).toBe("0.00 L");
    expect(formatLitres(-104.89, 2)).toBe("−104.89 L");
  });

  it("formats litres", () => {
    expect(formatLitres(38)).toBe("38 L");
    expect(formatLitres(104.89, 2)).toBe("104.89 L");
    expect(formatLitres(38, 2)).toBe("38.00 L");
    expect(formatLitres(1250)).toBe("1,250 L");
  });

  it("formats IST times whatever the host TZ", () => {
    const t = 28 * 1440 + 2 * 60 + 14; // 27 Sep 02:14 IST
    expect(formatTimeIST(t)).toBe("2:14 AM");
  });

  it("handles noon, midnight and the demo clock", () => {
    expect(formatTimeIST(at(SEP_27, 12, 0))).toBe("12:00 PM");
    expect(formatTimeIST(at(SEP_27, 0, 5))).toBe("12:05 AM");
    expect(formatTimeIST(at(SEP_27, 23, 59))).toBe("11:59 PM");
    expect(formatTimeIST(at(SEP_28, 7, 12))).toBe("7:12 AM");
    expect(formatTimeIST(at(SEP_28, 6, 55))).toBe("6:55 AM");
  });

  it("formats IST dates", () => {
    expect(formatDateIST(at(SEP_27, 2, 14), "weekday-day-month")).toBe("Sun 27 Sep");
    expect(formatDateIST(at(SEP_27, 2, 14), "day-month")).toBe("27 Sep");
    expect(formatDateIST(at(SEP_28, 7, 12), "weekday-day-month")).toBe("Mon 28 Sep");
    expect(formatDateIST(0, "weekday-day-month")).toBe("Sat 29 Aug");
    // 23:59 IST stays on the same IST day even though it is the next day in UTC+
    expect(formatDateIST(at(SEP_27, 23, 59), "day-month")).toBe("27 Sep");
  });

  it("splits minutes into IST parts", () => {
    expect(minToISTParts(at(SEP_28, 7, 12))).toEqual({
      year: 2026,
      month: 9,
      day: 28,
      hour: 7,
      minute: 12,
      weekday: 1,
    });
    expect(minToISTParts(0)).toEqual({
      year: 2026,
      month: 8,
      day: 29,
      hour: 0,
      minute: 0,
      weekday: 6,
    });
  });

  it("anchors the epoch at 2026-08-29T00:00+05:30", () => {
    expect(EPOCH_UTC_MS).toBe(Date.parse("2026-08-29T00:00:00+05:30"));
  });
});
