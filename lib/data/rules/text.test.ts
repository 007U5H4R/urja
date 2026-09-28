import { describe, expect, it } from "vitest";
import { istMin } from "@/lib/clock";
import { rangeEn, rangeHi, timeHi } from "./text";

const at = (h: number, m: number) => istMin(2026, 9, 27, h, m);

describe("evidence time ranges", () => {
  it("names the part of day once when it does not change", () => {
    expect(rangeEn(at(2, 8), at(2, 44))).toBe("2:08–2:44 AM");
    expect(rangeHi(at(2, 8), at(2, 44))).toBe("रात 2:08–2:44");
  });

  it("keeps the second part of day when it changes", () => {
    expect(rangeEn(at(11, 50), at(12, 30))).toBe("11:50 AM–12:30 PM");
    expect(rangeHi(at(20, 40), at(21, 20))).toBe("शाम 8:40–रात 9:20");
  });

  it("uses §5.3's parts of day: रात 9 PM–4 AM, सुबह 4–12, दोपहर 12–4 PM, शाम 4–9 PM", () => {
    expect([
      timeHi(at(19, 20)), timeHi(at(20, 59)), timeHi(at(21, 0)), timeHi(at(3, 59)),
      timeHi(at(4, 0)), timeHi(at(11, 59)), timeHi(at(12, 0)), timeHi(at(16, 0)),
    ]).toEqual(["शाम 7:20", "शाम 8:59", "रात 9:00", "रात 3:59", "सुबह 4:00", "सुबह 11:59", "दोपहर 12:00", "शाम 4:00"]);
  });
});
