import { describe, expect, it } from "vitest";
import { grade } from "./confidence";

describe("confidence (§4.4)", () => {
  it("is High at a 2× margin with a quiet sensor and no GPS gaps", () => {
    expect(grade({ margin: 38 / 15, maxGapMin: 1, noiseBandL: 2 })).toBe("high");
  });
  it("drops to Likely on a GPS gap over 5 min or a noisy sensor", () => {
    expect(grade({ margin: 3, maxGapMin: 6, noiseBandL: 2 })).toBe("likely");
    expect(grade({ margin: 3, maxGapMin: 1, noiseBandL: 3 })).toBe("likely");
  });
  it("is Likely at 1.25× and Check below", () => {
    expect(grade({ margin: 1.25, maxGapMin: 1, noiseBandL: 2 })).toBe("likely");
    expect(grade({ margin: 1.2, maxGapMin: 1, noiseBandL: 2 })).toBe("check");
  });
  it("applies caps downward only", () => {
    expect(grade({ margin: 3, maxGapMin: 1, noiseBandL: 2, cap: "likely" })).toBe("likely");
    expect(grade({ margin: 1.5, maxGapMin: 1, noiseBandL: 2, cap: "check" })).toBe("check");
    expect(grade({ margin: 1.0, maxGapMin: 1, noiseBandL: 2, cap: "likely" })).toBe("check");
  });
});
