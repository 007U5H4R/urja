import { describe, expect, it } from "vitest";
import { STREAM_LADDERS, STREAMS } from "@/content/bet/streams";
import { R2 } from "@/lib/data/constants";
import { getDataset, tripById, type ReadonlyFlag } from "@/lib/data";
import { grade } from "@/lib/data/rules/confidence";
import { R2_AFTER_MIN, R2_BEFORE_MIN } from "@/lib/data/rules/r2-refuel-mismatch";
import { indexAt, maxGapMin, noiseBandL, smoothFuelCl } from "@/lib/data/rules/signal";
import type { Trip } from "@/lib/data/types";
import { atLeast, defaultStepIndex, familiesAt, fuseSteps, lower, RANK, STREAM_OF } from "./fusion";

const flags = getDataset().flags;
const flagById = (id: string): ReadonlyFlag => {
  const f = flags.find((x) => x.id === id);
  if (!f) throw new Error(`no flag ${id}`);
  return f;
};
const path = (id: string) => fuseSteps(flagById(id)).map((s) => [s.streamId, s.level, s.simulated] as const);
const familiesOf = (id: string) => {
  const steps = fuseSteps(flagById(id));
  return steps.map((_, i) => familiesAt(steps, i));
};

/** R2's grade with the hand-typed cap removed, from the flag's own trip (as the rule computes it). */
function uncappedR2(f: ReadonlyFlag) {
  // The rules read the frozen dataset without changing it; they are typed for plain trips (as lib/data/views/trip.ts casts).
  const t = tripById(f.tripId) as unknown as Trip;
  const bill = t.refuels.find((r) => r.t === f.at)!;
  const s = smoothFuelCl(t.samples);
  const rise = s[indexAt(t.samples, bill.t + R2_AFTER_MIN)] - s[indexAt(t.samples, bill.t - R2_BEFORE_MIN)];
  return grade({
    margin: (bill.billedCl - rise) / ((rise * R2.overPct) / 100),
    maxGapMin: maxGapMin(t.samples, bill.t - R2_BEFORE_MIN, bill.t + R2_AFTER_MIN),
    noiseBandL: noiseBandL(t.samples, s, [[bill.t - R2_BEFORE_MIN, bill.t + R2_AFTER_MIN + 3]]),
  });
}

describe("TASK-22 · stream fusion", () => {
  it("covers every flag in the dataset", () => {
    expect(flags.length).toBe(23);
  });

  it("invariant: the last non-simulated step equals the flag's own confidence, on every flag", () => {
    for (const f of flags) {
      const steps = fuseSteps(f);
      const real = steps.filter((s) => !s.simulated);
      expect(real.length, f.id).toBeGreaterThan(0);
      expect(real[real.length - 1].level, f.id).toBe(f.confidence);
      expect(steps[defaultStepIndex(steps)], f.id).toBe(real[real.length - 1]);
    }
  });

  it("simulated steps only ever come after the real ones, and the level never falls", () => {
    const rank = { check: 0, likely: 1, high: 2 } as const;
    for (const f of flags) {
      const steps = fuseSteps(f);
      const firstSim = steps.findIndex((s) => s.simulated);
      if (firstSim >= 0) expect(steps.slice(firstSim).every((s) => s.simulated), f.id).toBe(true);
      for (let i = 1; i < steps.length; i++) expect(rank[steps[i].level], f.id).toBeGreaterThanOrEqual(rank[steps[i - 1].level]);
      for (const s of steps) {
        expect(s.note.trim(), f.id).not.toBe("");
        expect(s.label, f.id).toBe(STREAMS[s.streamId].label);
        expect(s.system, f.id).toBe(STREAMS[s.streamId].system);
        expect("family" in s, f.id).toBe(false);
        expect(s.simulated, f.id).toBe(STREAMS[s.streamId].simulated);
      }
    }
  });

  it("showcase 0926-04 (R1, High): Check → Likely → High, and Camera keeps High with a second family", () => {
    expect(path("0926-04-R1")).toEqual([
      ["gps-ignition", "check", false],
      ["can-fuel", "likely", false],
      ["geofence", "likely", false],
      ["fleet-history", "high", false],
      ["camera", "high", true],
    ]);
    const steps = fuseSteps(flagById("0926-04-R1"));
    expect(familiesOf("0926-04-R1")).toEqual([1, 1, 1, 1, 2]);
    // GPS, the fuel sensor, geofence and fleet history are one system: the truck's own tracker.
    expect(new Set(steps.filter((s) => !s.simulated).map((s) => s.system))).toEqual(new Set(["truck-telematics"]));
    expect(steps[1].note).toMatch(/10–40 L/);
  });

  it("showcase 0927-02 (R2, Likely): the hand-typed cap holds until bill OCR lifts it to High", () => {
    expect(path("0927-02-R2")).toEqual([
      ["fuel-bill-typed", "check", false],
      ["can-fuel", "likely", false],
      ["geofence", "likely", false],
      ["bill-ocr", "high", true],
    ]);
    const steps = fuseSteps(flagById("0927-02-R2"));
    expect(steps[2].note).toMatch(/typed by hand, a bill can also cover cans or a second tank/);
    expect(steps[3].note).toMatch(/second tank is the one thing a bill can't rule out/);
    expect(steps[3].note).toMatch(/OCR/);
    // The typed bill is the claim under test, so there is no family until the tank reading joins.
    expect(steps[0].corroborates).toBe(false);
    expect(familiesOf("0927-02-R2")).toEqual([0, 1, 1, 2]);
  });

  it("every R2 flag whose bill-OCR step lifts the cap clears High on its own numbers, so OCR overclaims nothing", () => {
    let lifted = 0;
    for (const f of flags.filter((x) => x.rule === "R2")) {
      const steps = fuseSteps(f);
      const ocr = steps.findIndex((s) => s.streamId === "bill-ocr");
      if (ocr < 0 || steps[ocr].level === steps[defaultStepIndex(steps)].level) continue;
      lifted++;
      expect(steps[ocr].level, f.id).toBe("high");
      expect(uncappedR2(f), f.id).toBe("high");
    }
    expect(lifted).toBeGreaterThan(0); // 0927-02, the showcase, at least
  });

  it("showcase 0926-11 (R3, heavy load): stays Check at every step and says no stream lifts a load cap", () => {
    const steps = fuseSteps(flagById("0926-11-R3"));
    expect(steps.map((s) => s.level)).toEqual(steps.map(() => "check"));
    expect(steps.some((s) => s.simulated)).toBe(false);
    const last = steps[steps.length - 1].note;
    expect(last).toMatch(/No stream lifts a load cap/);
    expect(last).toMatch(/load-adjusted norm/);
    expect(last).toMatch(/roadmap/);
  });

  it("0926-11: the heavier load argues against the flag, so the e-way bill is no agreeing family", () => {
    const steps = fuseSteps(flagById("0926-11-R3"));
    expect(steps.map((s) => [s.streamId, s.corroborates])).toEqual([
      ["fleet-history", true],
      ["eway-bill", false],
      ["can-fuel", true],
    ]);
    expect(familiesOf("0926-11-R3")).toEqual([1, 1, 1]);
  });

  it("only R3 flags held by the load cap have a contradicting e-way bill", () => {
    for (const f of flags) {
      const steps = fuseSteps(f);
      const against = steps.filter((s) => !s.corroborates && s.streamId !== "fuel-bill-typed");
      if (f.rule !== "R3") expect(against, f.id).toEqual([]);
      else expect(against.length > 0, f.id).toBe(/load cap/.test(steps[steps.length - 1].note));
    }
  });

  it("a ladder step that can contradict the flag carries the note saying so", () => {
    for (const ladder of Object.values(STREAM_LADDERS)) {
      for (const def of ladder.steps) if (def.contradicts) expect(def.againstNote?.trim(), def.stream).toBeTruthy();
    }
    expect(STREAM_LADDERS.R3.steps.find((d) => d.stream === "eway-bill")!.contradicts).toBe("load-cap");
  });

  it("an R3 held by a narrow margin (0917-06) says so, not the load cap", () => {
    const steps = fuseSteps(flagById("0917-06-R3"));
    expect(steps.map((s) => s.level)).toEqual(steps.map(() => "check"));
    expect(steps.map((s) => s.note).join(" ")).not.toMatch(/load cap/);
    expect(steps[1].note).toMatch(/12% allowance/);
    // The load was within the usual, so the e-way bill backs the flag and adds the second family.
    expect(steps.every((s) => s.corroborates)).toBe(true);
    expect(familiesOf("0917-06-R3")).toEqual([1, 2, 2]);
  });

  it("R4 and R5 ladders use their own sources and no simulated stream", () => {
    for (const rule of ["R4", "R5"] as const) {
      expect(STREAM_LADDERS[rule].steps.some((s) => STREAMS[s.stream].simulated), rule).toBe(false);
    }
    const r4 = flags.find((f) => f.rule === "R4")!;
    expect(fuseSteps(r4).map((s) => s.streamId)).toEqual(["gps-ignition", "eway-bill", "geofence", "fleet-history"]);
    const r5 = flags.find((f) => f.rule === "R5")!;
    expect(fuseSteps(r5).map((s) => s.streamId)).toEqual(["fastag", "gps-ignition"]);
  });

  it("each rule's ladder covers every evidence source its flags carry", () => {
    for (const f of flags) {
      const ids = new Set(fuseSteps(f).map((s) => s.streamId));
      for (const e of f.evidence) expect(ids.has(STREAM_OF[e.source]), `${f.id}: ${e.source}`).toBe(true);
    }
  });

  it("ranks levels once, for fusion and the action ladder", () => {
    expect(RANK).toEqual({ check: 0, likely: 1, high: 2 });
    expect(lower("high", "likely")).toBe("likely");
    expect(lower("check", "high")).toBe("check");
    expect(atLeast("likely", "likely")).toBe(true);
    expect(atLeast("check", "likely")).toBe(false);
  });

  it("is deterministic and never changes the flag", () => {
    for (const f of flags) {
      const before = structuredClone(f);
      const a = fuseSteps(f);
      const b = fuseSteps(f);
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(f).toEqual(before);
    }
    // And on an unfrozen copy, so a write would not just throw on the frozen dataset.
    const copy = structuredClone(flagById("0926-04-R1")) as ReadonlyFlag;
    const snapshot = JSON.stringify(copy);
    fuseSteps(copy);
    expect(JSON.stringify(copy)).toBe(snapshot);
  });
});
