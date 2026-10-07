import { describe, expect, it } from "vitest";
import { ADVANCE_HOLD_ABOVE_INR, TIERS, type Tier } from "@/content/bet/ladder";
import { getDataset, type ReadonlyFlag } from "@/lib/data";
import { familiesAt, fuseSteps } from "./fusion";
import { LADDER_LEVEL_META, ladderFor, type LadderActionView, type LadderLevelView } from "./ladder";

const flags = getDataset().flags;
const flagById = (id: string): ReadonlyFlag => {
  const f = flags.find((x) => x.id === id);
  if (!f) throw new Error(`no flag ${id}`);
  return f;
};
const action = (levels: LadderLevelView[], id: string): LadderActionView | undefined =>
  levels.flatMap((l) => l.actions).find((a) => a.id === id);
const lastIndex = (f: ReadonlyFlag) => fuseSteps(f).length - 1;
const realIndex = (f: ReadonlyFlag) => fuseSteps(f).findLastIndex((s) => !s.simulated);

describe("TASK-22 · action ladder", () => {
  it("has the five levels of bet-spec §7, each on its tier", () => {
    const levels = ladderFor(flagById("0926-04-R1"), 0, "free");
    expect(levels.map((l) => l.title)).toEqual([
      "L1 Insight",
      "L2 Deterministic action",
      "L3 Corrective SOP",
      "L4 Guardrail",
      "L5 Autopilot",
    ]);
    expect(levels.map((l) => l.tier)).toEqual(["free", "munshi", "pro", "autopilot", null]);
    expect(levels[0].actions).toEqual([]);
    expect(levels[4].actions.map((a) => [a.state, a.reason])).toEqual([["future", "Future, not building now."]]);
    expect(TIERS.map((t) => t.id)).toEqual(["free", "munshi", "pro", "autopilot"]);
  });

  it("an action above the chosen tier needs that tier", () => {
    const f = flagById("0926-04-R1");
    const free = ladderFor(f, realIndex(f), "free");
    expect(action(free, "hold-fuel-card")!.state).toBe("needs-tier");
    expect(action(free, "hold-fuel-card")!.reason).toMatch(/Munshi/);
    expect(action(free, "route-norm")!.state).toBe("needs-tier");
    expect(action(free, "auto-hold-advance")!.state).toBe("needs-tier");
    const pro = ladderFor(f, realIndex(f), "pro");
    expect(action(pro, "hold-fuel-card")!.state).toBe("available");
    expect(action(pro, "night-stop")!.state).toBe("available");
    expect(action(pro, "auto-hold-advance")!.state).toBe("needs-tier");
  });

  it("Hold the fuel card needs Likely or above", () => {
    const f = flagById("0926-04-R1");
    expect(action(ladderFor(f, 0, "munshi"), "hold-fuel-card")!.state).toBe("needs-confidence"); // Check
    expect(action(ladderFor(f, 1, "munshi"), "hold-fuel-card")!.state).toBe("available"); // Likely
    const r3 = flagById("0926-11-R3");
    expect(action(ladderFor(r3, realIndex(r3), "autopilot"), "hold-fuel-card")!.state).toBe("needs-confidence");
  });

  it("Recover asks for inr − recoveredInr and needs High or a confirmed flag", () => {
    const f = flagById("0926-04-R1");
    const likely = action(ladderFor(f, 1, "munshi"), "recover")!;
    expect(likely.state).toBe("needs-confidence");
    const high = action(ladderFor(f, realIndex(f), "munshi"), "recover")!;
    expect(high.state).toBe("available");
    expect(high.amountInr).toBe(f.inr - f.recoveredInr);
    expect(high.label).toBe("Recover ₹3,420 from settlement");

    // Partly recovered and confirmed: what is left, available even at a Check step.
    const part = flagById("0923-02-R1");
    expect(part.recoveredInr).toBeGreaterThan(0);
    const left = action(ladderFor(part, 0, "munshi"), "recover")!;
    expect(left.amountInr).toBe(part.inr - part.recoveredInr);
    expect(left.state).toBe("available");

    // A Check flag still waiting cannot move money.
    const r3 = flagById("0926-11-R3");
    expect(action(ladderFor(r3, realIndex(r3), "autopilot"), "recover")!.state).toBe("needs-confidence");

    // Recovered in full: nothing left to take.
    const full = flagById("0831-02-R5");
    expect(full.inr - full.recoveredInr).toBe(0);
    const done = action(ladderFor(full, 0, "munshi"), "recover")!;
    expect(done.state).toBe("closed");
    expect(done.label).toBe("Recover from settlement");
    expect(done.amountInr).toBeUndefined();
    expect(done.reason).toBe("Already recovered in full: ₹1,220.");
  });

  it("L4 auto-hold needs High and at least two independent families", () => {
    const f = flagById("0926-04-R1");
    const steps = fuseSteps(f);
    const real = realIndex(f);
    expect(steps[real].level).toBe("high");
    expect(familiesAt(steps, real)).toBe(1);
    const atReal = action(ladderFor(f, real, "autopilot"), "auto-hold-advance")!;
    expect(atReal.state).toBe("needs-confidence");
    expect(atReal.reason).toMatch(/2 independent/);
    const withCamera = action(ladderFor(f, lastIndex(f), "autopilot"), "auto-hold-advance")!;
    expect(withCamera.state).toBe("available");
    expect(withCamera.amountInr).toBe(ADVANCE_HOLD_ABOVE_INR);
    expect(withCamera.label).toBe("Auto-hold driver advances above ₹2,000");

    // 0927-02: Likely on one family until bill OCR adds the pump's own bill and lifts it to High.
    const r2 = flagById("0927-02-R2");
    expect(action(ladderFor(r2, realIndex(r2), "autopilot"), "auto-hold-advance")!.state).toBe("needs-confidence");
    expect(action(ladderFor(r2, lastIndex(r2), "autopilot"), "auto-hold-advance")!.state).toBe("available");

    // For every flag and step: available exactly when High and ≥ 2 families (and the flag is not marked wrong).
    for (const g of flags) {
      const st = fuseSteps(g);
      st.forEach((s, i) => {
        const a = action(ladderFor(g, i, "autopilot"), "auto-hold-advance")!;
        const ok = s.level === "high" && familiesAt(st, i) >= 2 && g.status !== "wrong";
        expect(a.state === "available", `${g.id} step ${i}`).toBe(ok);
      });
    }
  });

  it("L3 SOPs follow the rule: pump block on R2, night stops on R1, a route norm on the diesel rules", () => {
    const r2 = ladderFor(flagById("0927-02-R2"), 0, "pro");
    expect(action(r2, "block-pump")!.label).toMatch(/Kishangarh/);
    expect(action(r2, "night-stop")).toBeUndefined();
    const r1 = ladderFor(flagById("0926-04-R1"), 0, "pro");
    expect(action(r1, "night-stop")!.label).toMatch(/Behror stretch/);
    expect(action(r1, "block-pump")).toBeUndefined();
    expect(action(r1, "route-norm")!.label).toBe("Set the Jaipur → Delhi (Okhla) diesel norm at 80 L");
    const r5 = ladderFor(flagById("0903-08-R5"), 0, "pro");
    const r5l3 = r5.find((l) => l.id === "L3")!;
    expect(r5l3.actions).toEqual([]);
    expect(r5l3.note).toBe("No corrective SOP for this rule yet.");
    expect(r1.find((l) => l.id === "L3")!.note).toBeNull();
  });

  it("a flag marked wrong closes every action; a confirmed one closes asking and holding", () => {
    const wrong = ladderFor(flagById("0909-07-R5"), 1, "autopilot");
    for (const l of wrong.filter((x) => x.id !== "L5")) for (const a of l.actions) expect(a.state, a.id).toBe("closed");
    const confirmed = ladderFor(flagById("0903-08-R5"), 1, "autopilot");
    expect(action(confirmed, "ask-driver")!.state).toBe("closed");
    expect(action(confirmed, "hold-fuel-card")!.state).toBe("closed");
    expect(action(confirmed, "recover")!.state).toBe("available");
  });

  it("every action has a plain-English reason, and no tier skips a level", () => {
    const tiers: Tier[] = ["free", "munshi", "pro", "autopilot"];
    const T = true,
      F = false;
    const unlocked: Record<Tier, boolean[]> = {
      free: [T, F, F, F, F],
      munshi: [T, T, F, F, F],
      pro: [T, T, T, F, F],
      autopilot: [T, T, T, T, F],
    };
    for (const f of flags) {
      fuseSteps(f).forEach((_, i) => {
        for (const t of tiers) {
          const levels = ladderFor(f, i, t);
          // A true prefix, then all false: a tier never unlocks a level without the ones below it.
          expect(levels.map((l) => l.unlocked), `${f.id} ${i} ${t}`).toEqual(unlocked[t]);
          expect(levels[4].tierLabel).toBe("Future");
          for (const l of levels) {
            for (const a of l.actions) {
              expect(a.reason.trim(), `${f.id} ${a.id}`).not.toBe("");
              expect(a.label.trim(), `${f.id} ${a.id}`).not.toBe("");
            }
          }
        }
      });
    }
  });

  it("each level's static fields come from one table, the same for every flag, step and tier", () => {
    expect(LADDER_LEVEL_META.map((m) => [m.title, m.tierLabel])).toEqual([
      ["L1 Insight", "Free"],
      ["L2 Deterministic action", "Munshi"],
      ["L3 Corrective SOP", "Pro"],
      ["L4 Guardrail", "Autopilot"],
      ["L5 Autopilot", "Future"],
    ]);
    for (const f of flags) {
      for (const t of TIERS) {
        const levels = ladderFor(f, 0, t.id);
        levels.forEach((l, k) => {
          const { id, name, title, tier, tierLabel, summary } = l;
          expect({ id, name, title, tier, tierLabel, summary }).toEqual(LADDER_LEVEL_META[k]);
        });
      }
    }
  });

  it("rejects a step outside the ladder", () => {
    const f = flagById("0926-04-R1");
    expect(() => ladderFor(f, 99, "free")).toThrow(RangeError);
    expect(() => ladderFor(f, -1, "free")).toThrow(RangeError);
  });

  it("is deterministic and never changes the flag", () => {
    const f = flagById("0926-04-R1");
    const before = structuredClone(f);
    expect(ladderFor(f, 2, "pro")).toEqual(ladderFor(f, 2, "pro"));
    expect(f).toEqual(before);
  });
});
