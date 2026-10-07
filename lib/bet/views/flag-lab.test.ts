import { describe, expect, it } from "vitest";
import { TIERS } from "@/content/bet/ladder";
import { FAMILIES_NOTE, NOT_COUNTED_NOTE, STREAMS, SYSTEM_LABEL } from "@/content/bet/streams";
import { getDataset } from "@/lib/data";
import { flagsForTrip } from "@/lib/data/aggregates";
import { fuseSteps } from "../fusion";
import { LADDER_LEVEL_META, ladderFor } from "../ladder";
import { getFlagLabView } from "./flag-lab";

const ds = getDataset();
const flagged = new Set(ds.flags.map((f) => f.tripId));

describe("TASK-22 · flag-lab view", () => {
  it("is null for a clean trip, a trip still on the road and an unknown id", () => {
    const clean = ds.trips.find((t) => !flagged.has(t.id))!;
    expect(getFlagLabView(clean.id)).toBeNull();
    expect(ds.live.length).toBeGreaterThan(0);
    for (const t of ds.live) expect(getFlagLabView(t.id)).toBeNull();
    expect(getFlagLabView("9999-99")).toBeNull();
  });

  it("gives every flagged trip its flags, in eye order", () => {
    for (const id of flagged) {
      const v = getFlagLabView(id)!;
      expect(v.tripId).toBe(id);
      expect(v.flags.map((f) => f.id)).toEqual(flagsForTrip(id).map((f) => f.id));
      expect(v.flags.length).toBe(ds.flags.filter((f) => f.tripId === id).length);
    }
  });

  it("starts on the last real step, so it matches the flag card", () => {
    for (const id of flagged) {
      for (const f of getFlagLabView(id)!.flags) {
        const step = f.steps[f.defaultStep];
        expect(step.simulated, f.id).toBe(false);
        expect(step.level, f.id).toBe(f.confidence);
        expect(f.steps.slice(f.defaultStep + 1).every((s) => s.simulated), f.id).toBe(true);
      }
    }
  });

  it("precomputes the ladder for every step × tier: static level fields once, the dynamic ones per cell, equal to ladderFor", () => {
    for (const id of flagged) {
      const v = getFlagLabView(id)!;
      expect(v.levels).toEqual(LADDER_LEVEL_META);
      for (const fv of v.flags) {
        const flag = ds.flags.find((f) => f.id === fv.id)!;
        expect(fv.matrix).toHaveLength(fuseSteps(flag).length);
        fv.matrix.forEach((row, i) => {
          expect(Object.keys(row).sort()).toEqual(TIERS.map((t) => t.id).sort());
          for (const t of TIERS) {
            const dynamic = ladderFor(flag, i, t.id).map(({ unlocked, note, actions }) => ({ unlocked, note, actions }));
            expect(row[t.id], `${fv.id} ${i} ${t.id}`).toStrictEqual(dynamic);
          }
        });
      }
    }
  });

  it("is plain JSON, so it crosses to a client component unchanged", () => {
    for (const id of flagged) {
      const v = getFlagLabView(id)!;
      expect(JSON.parse(JSON.stringify(v)), id).toStrictEqual(v);
    }
  });

  it("says what an independent family is, and which source each step comes from", () => {
    const v = getFlagLabView("0926-04")!;
    expect(v.familiesNote).toBe(FAMILIES_NOTE);
    expect(v.familiesNote).toMatch(/separate sources, not stream types/);
    const f = v.flags[0];
    // No raw §6 family column on a step, so the UI can't show four "family" labels beside "1 independent family".
    for (const s of f.steps) expect("family" in s).toBe(false);
    const real = f.steps.filter((s) => !s.simulated);
    expect(new Set(real.map((s) => s.source))).toEqual(new Set([SYSTEM_LABEL["truck-telematics"]]));
    expect(f.steps[4].source).toBe(SYSTEM_LABEL.camera);
    expect(f.steps.every((s) => s.counts && s.countNote === null)).toBe(true);
    for (const id of flagged) {
      for (const fl of getFlagLabView(id)!.flags) {
        for (const s of fl.steps) expect(s.source, `${fl.id} ${s.streamId}`).toBe(SYSTEM_LABEL[STREAMS[s.streamId].system]);
      }
    }
  });

  it("0927-02: the typed bill is the claim, so it doesn't count and there is no family yet", () => {
    const f = getFlagLabView("0927-02")!.flags[0];
    expect(f.steps.map((s) => s.families)).toEqual([0, 1, 1, 2]);
    expect(f.steps[0].counts).toBe(false);
    expect(f.steps[0].countNote).toBe(NOT_COUNTED_NOTE);
    expect(f.steps[0].familiesText).toBe("No independent family yet");
    expect(f.steps[3].familiesText).toBe("2 independent families");
  });

  it("0926-11: the heavier load on the e-way bill argues against the flag, so it doesn't count", () => {
    const f = getFlagLabView("0926-11")!.flags.find((x) => x.rule === "R3")!;
    expect(f.steps.map((s) => s.families)).toEqual([1, 1, 1]);
    expect(f.steps.map((s) => s.counts)).toEqual([true, false, true]);
    expect(f.steps[1].countNote).toMatch(/^Argues against the flag here: the extra diesel may be the load/);
    expect(f.steps[1].familiesText).toBe("1 independent family");
  });

  it("formats the showcase 0926-04 for display", () => {
    const f = getFlagLabView("0926-04")!.flags[0];
    expect(f.id).toBe("0926-04-R1");
    expect(f.ruleName).toBe("Stationary fuel drop");
    expect(f.confidenceWord).toBe("High");
    expect(f.inrText).toBe("₹3,420");
    expect(f.steps.map((s) => s.levelWord)).toEqual(["Check", "Likely", "Likely", "High", "High"]);
    expect(f.steps.map((s) => s.families)).toEqual([1, 1, 1, 1, 2]);
    expect(f.steps[4].familiesText).toBe("2 independent families");
    expect(f.steps[0].familiesText).toBe("1 independent family");
    expect(f.steps[4].simulatedTag).toBe("Simulated");
    expect(f.steps[0].simulatedTag).toBeNull();
    // Each real step carries the flag's own evidence lines from that stream.
    expect(f.steps[1].evidence[0]).toMatch(/^Fuel fell \d+ → \d+ L/);
    expect(f.steps[4].evidence).toEqual([]);
  });

  it("is deterministic and leaves the dataset unchanged", () => {
    const before = JSON.stringify(ds.flags);
    expect(getFlagLabView("0927-02")).toEqual(getFlagLabView("0927-02"));
    expect(JSON.stringify(ds.flags)).toBe(before);
  });
});
