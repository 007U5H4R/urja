import { describe, expect, it } from "vitest";
import { detectR5 } from "./r5-toll";
import { synthTrip } from "./test-trip";

const fastag = [{ t: 100, placeId: "manoharpur-plaza", inr: 705 }];

describe("R5 · toll mismatch (TC-011)", () => {
  it("does not fire on a ₹49 difference", () => {
    expect(detectR5(synthTrip({ fastag, tollsClaimInr: 754 }))).toEqual([]);
  });

  it("fires on a ₹50 difference", () => {
    const [f] = detectR5(synthTrip({ fastag, tollsClaimInr: 755 }));
    expect([f.rule, f.inr]).toEqual(["R5", 50]);
    expect(f.evidence[0].text.en).toBe("Claimed ₹755 for tolls; FASTag shows ₹705 at 1 plaza");
  });
});
