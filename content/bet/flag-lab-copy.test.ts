import { describe, expect, it } from "vitest";
import { PROTOTYPE_NOTE } from "./copy";
import { FLAG_LAB_COPY as C, flagLabClaims } from "./flag-lab-copy";
import { LADDER_CLAIMS } from "./ladder";
import { citedSourceIds, isCited } from "./sources";
import { STREAM_LADDERS, STREAMS, type StreamId } from "./streams";

// TASK-25: the flag lab's own copy on the trip page.

describe("TASK-25 · flag-lab copy", () => {
  it("frames the lab as a prototype of the bet and links to /bet, without claiming it is live", () => {
    expect(C.id).toBe("flag-lab");
    expect(C.heading).toBe("Flag lab");
    expect(C.intro.lead).toMatch(/^A prototype of the SuprFleet bet/);
    expect(C.intro.lead).toMatch(/not something Urja does today/);
    // 0926-11 stays at Check, so the intro doesn't promise that confidence always rises.
    expect(C.intro.lead).toMatch(/watch how confidence changes/);
    expect(C.intro.lead).not.toMatch(/confidence rise/);
    expect(C.intro.href).toBe("/bet");
    expect(C.intro.link.trim()).not.toBe("");
  });

  it("names the step and tier controls in words", () => {
    expect(C.stepValueText(4, 5, "Fleet history", "High")).toBe("Step 4 of 5: Fleet history, High");
    expect(C.stepCount(4, 5)).toBe("Step 4 of 5");
    expect(C.lock.unlocked).toBe("Unlocked");
    expect(C.lock.locked).toBe("Locked");
    expect(C.lock.future).toBe("Future");
    expect(C.stepState.later).toBe("Not added yet");
  });

  it("announces a step or tier change in one short line", () => {
    expect(C.announce({ step: 5, total: 5, levelWord: "High", familiesText: "2 independent families", tier: "Autopilot", unlockedThrough: "L4", available: 5 })).toBe(
      "Step 5 of 5: High, 2 independent families. Autopilot: L1 to L4 unlocked, 5 actions available.",
    );
    expect(C.announce({ step: 1, total: 4, levelWord: "Check", familiesText: "No independent family yet", tier: "Free", unlockedThrough: "L1", available: 0 })).toBe(
      "Step 1 of 4: Check, No independent family yet. Free: L1 unlocked, no action available.",
    );
    expect(C.announce({ step: 2, total: 3, levelWord: "Likely", familiesText: "1 independent family", tier: "Munshi", unlockedThrough: "L2", available: 1 })).toMatch(
      /Munshi: L1 to L2 unlocked, 1 action available\.$/,
    );
  });

  it("an action shows the bet's prototype note and says nothing was carried out", () => {
    const note = C.actionNote("Hold the fuel card");
    expect(note.startsWith(PROTOTYPE_NOTE)).toBe(true);
    expect(note).toContain("Hold the fuel card");
    expect(note).toMatch(/nothing was sent/i);
  });

  it("the lab's claims: the rules' level bases, then the cited claims of each stream shown, then the ladder's assumptions", () => {
    const r1 = ["gps-ignition", "can-fuel", "geofence", "fleet-history", "camera"] as const;
    expect(flagLabClaims(["R1"], r1)).toEqual([
      STREAM_LADDERS.R1.basis,
      ...cited("gps-ignition"),
      ...cited("can-fuel"),
      ...LADDER_CLAIMS,
    ]);
    // The CAN fuel step's "10–40 L steps" is a sourced figure, so it is cited.
    expect(citedSourceIds(flagLabClaims(["R1"], r1))).toContain("can-fuel-steps");
    // One basis per rule and one entry per stream, in order, without repeats.
    expect(flagLabClaims(["R2", "R1", "R2"], ["fastag", "can-fuel", "fastag"])).toEqual([
      STREAM_LADDERS.R2.basis,
      STREAM_LADDERS.R1.basis,
      ...cited("fastag"),
      ...cited("can-fuel"),
      ...LADDER_CLAIMS,
    ]);
    // Uncited stream claims (assumptions such as the camera's) are not repeated here.
    expect(flagLabClaims(["R1"], ["camera"])).toEqual([STREAM_LADDERS.R1.basis, ...LADDER_CLAIMS]);
  });

  it("every stream figure a step note shows is backed by that stream's cited claim", () => {
    // The step notes that quote a sourced figure; each one's stream carries the citation.
    expect(STREAM_LADDERS.R1.steps.find((s) => s.stream === "can-fuel")!.note).toMatch(/10–40 L/);
    expect(cited("can-fuel").some((c) => c.text.includes("10–40 L") && c.sourceIds.includes("can-fuel-steps"))).toBe(true);
  });

  it("names the footer for both its sources and its assumptions", () => {
    expect(C.claimsHeading).toBe("Sources and assumptions behind the lab");
  });
});

const cited = (id: StreamId) => STREAMS[id].claims.filter(isCited);
