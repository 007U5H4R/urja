import { describe, expect, it } from "vitest";
import { september, trucks } from "@/lib/data/aggregates";
import { citedSourceIds, isCited } from "@/content/bet/sources";
import { LOAN_ASSUMPTIONS, VERIFIED_DAY, VERIFIED_DAYS_TARGET } from "@/content/bet/trust";
import { trustFor } from "../trust";
import { plateToSlug } from "../slug";
import { getTruckView, type TruckView } from "./truck";

const ROWS = trucks();
const view = (plate: string): TruckView => {
  const v = getTruckView(plateToSlug(plate));
  if (!v) throw new Error(`No view for ${plate}`);
  return v;
};
const VIEWS = ROWS.map((r) => view(r.plate));
const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);

describe("getTruckView (TASK-23)", () => {
  it("returns null for a slug outside the fleet", () => {
    expect(getTruckView("xx00-zz-0000")).toBeNull();
    expect(getTruckView("")).toBeNull();
  });

  it("accepts the slug in any letter case", () => {
    expect(getTruckView("RJ14-GB-4521")?.headline.plate).toBe("RJ14 GB 4521");
  });

  it("each of the 24 headlines equals its trucks() row", () => {
    expect(VIEWS).toHaveLength(24);
    ROWS.forEach((row, i) => {
      const h = VIEWS[i].headline;
      expect({
        rank: h.rank,
        plate: h.plate,
        driver: h.driver,
        trips: h.trips,
        km: h.km,
        profitInr: h.profitInr,
        perKm: h.perKm,
        unaccountedInr: h.unaccountedInr,
        flags: h.flags,
      }).toEqual({
        rank: row.rank,
        plate: row.plate,
        driver: row.driver.en,
        trips: row.trips,
        km: row.km,
        profitInr: row.profitInr,
        perKm: row.perKm,
        unaccountedInr: row.unaccountedInr,
        flags: row.flags,
      });
    });
  });

  it("flagged and recovered ₹ across the 24 trucks reconcile to september()", () => {
    const s = september();
    expect(s.flaggedInr).toBe(58_240); // golden
    expect(s.recoveredInr).toBe(21_600); // golden
    expect(sum(VIEWS.map((v) => v.resolution.flaggedInr))).toBe(s.flaggedInr);
    expect(sum(VIEWS.map((v) => v.resolution.recoveredInr))).toBe(s.recoveredInr);
    expect(sum(VIEWS.map((v) => v.flagList.length))).toBe(s.flags);
    expect(sum(VIEWS.map((v) => v.resolution.total))).toBe(s.flags);
    expect(sum(VIEWS.map((v) => v.resolution.waiting))).toBe(s.waiting);
  });

  it("each truck's daily series covers 1–27 Sep and sums to its September profit and flags", () => {
    for (const v of VIEWS) {
      expect(v.daily).toHaveLength(27);
      expect(v.daily[0].dayKey).toBe("2026-09-01");
      expect(v.daily[26].dayKey).toBe("2026-09-27");
      expect(sum(v.daily.map((d) => d.profitInr))).toBe(v.headline.profitInr);
      expect(sum(v.daily.map((d) => d.flags))).toBe(v.headline.flags);
      expect(sum(v.daily.map((d) => d.trips))).toBe(v.headline.trips);
    }
  });

  it("the trust score is in 0–100 and labelled provisional with its verified days", () => {
    for (const v of VIEWS) {
      expect(v.trust.score).toBeGreaterThanOrEqual(0);
      expect(v.trust.score).toBeLessThanOrEqual(100);
      expect(v.trust.label).toBe(`Provisional (${v.verified.days} days)`);
      expect(sum(v.trust.factors.map((f) => f.weight))).toBe(100);
    }
  });

  it("shows N of 180 verified days, never more than the 27 recorded", () => {
    for (const v of VIEWS) {
      expect(v.verified.target).toBe(VERIFIED_DAYS_TARGET.days);
      expect(v.verified.days).toBeLessThanOrEqual(27);
      expect(v.verified.text).toBe(`${v.verified.days} of 180 verified days`);
      expect(v.verified.days).toBe(v.verified.dayKeys.length);
    }
  });

  it("every truck has all 27 recorded days verified (1–27 Sep, end-of-IST-day rule)", () => {
    for (const v of VIEWS) {
      expect(v.verified.recordedDays).toBe(27);
      expect(v.verified.days).toBe(27);
      expect(v.verified.text).toBe("27 of 180 verified days");
    }
  });

  it("pins RJ14 GC 3309: one flag now overdue, resolution 2/3, yet every September day verified", () => {
    const v = view("RJ14 GC 3309");
    expect(v.resolution.overdue).toBe(1);
    expect(v.resolution.total).toBe(3);
    expect(trustFor("RJ14 GC 3309").factors.resolution).toBeCloseTo(2 / 3);
    // At the end of 27 Sep the waiting flag is not yet 48 h old, so no September day fails.
    expect(v.daily.every((d) => d.verified)).toBe(true);
    expect(v.verified.days).toBe(27);
    expect(v.trust.score).toBe(63.9); // golden: Σ of the displayed row points
    expect(v.trust.scoreText).toBe("63.9");
  });

  it("explains how an overdue flag counts only on trucks that have one", () => {
    const tail = `A flag that has since passed ${VERIFIED_DAY.resolveWithinH} h counts against the next day to close.`;
    for (const v of VIEWS) {
      if (v.resolution.overdue > 0) expect(v.verified.note.endsWith(` ${tail}`)).toBe(true);
      else expect(v.verified.note).not.toContain(tail);
      expect(v.verified.note).toContain(`within ${VERIFIED_DAY.resolveWithinH} h`);
    }
  });

  it("the displayed score is trustFor's score for all 24 trucks: one definition", () => {
    expect(VIEWS).toHaveLength(24);
    for (const v of VIEWS) expect(v.trust.score).toBe(trustFor(v.plate).score);
  });

  it("the breakdown rows sum to the displayed score", () => {
    for (const v of VIEWS) {
      const rows = sum(v.trust.factors.map((f) => f.points));
      expect(Math.abs(rows - v.trust.score)).toBeLessThan(0.05);
      expect(v.trust.scoreText).toBe(v.trust.score.toFixed(1));
    }
  });

  it("the EMI headroom line names its 27-day window and is no forecast", () => {
    for (const v of VIEWS) {
      const emi = v.loan.lines.find((l) => l.startsWith("Indicative EMI headroom"));
      expect(emi).toBeDefined();
      expect(emi).not.toMatch(/a month|per month|monthly/i);
      expect(emi).toContain(`${v.verified.days} verified days`);
      expect(emi).toContain(`${Math.round(LOAN_ASSUMPTIONS.emiHeadroom.share * 100)}% of the surplus`);
      expect(emi).toContain("(1–27 Sep)");
      expect(emi).toMatch(/illustrative/);
      expect(emi).toMatch(/not a forecast/);
    }
  });

  it("has no projected numbers: Oct–Feb are not yet recorded and carry no amounts", () => {
    for (const v of VIEWS) {
      expect(v.months.map((m) => m.label)).toEqual(["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]);
      const [sep, ...future] = v.months;
      expect(sep.state).toBe("recorded");
      expect(sep.verifiedDays).toBe(v.verified.days);
      for (const m of future) {
        expect(m.state).toBe("not-yet");
        expect(m.verifiedDays).toBeNull();
        expect(m.surplusInr).toBeNull();
        expect(m.note).toBe("Not yet recorded");
        expect(JSON.stringify(m)).not.toMatch(/₹|\d{3,}/);
      }
    }
  });

  it("loan readiness is illustrative, from verified surplus, and names the consent step", () => {
    for (const v of VIEWS) {
      const verifiedSurplus = sum(v.daily.filter((d) => d.verified).map((d) => d.profitInr));
      expect(v.loan.verifiedSurplusInr).toBe(verifiedSurplus);
      expect(v.loan.illustrative).toBe(true);
      expect(v.loan.consent.text).toMatch(/Account Aggregator/);
      expect(v.loan.consent.text).toMatch(/DPDP/);
      expect(isCited(v.loan.consent)).toBe(false);
      expect(isCited(v.loan.partnership)).toBe(false);
      expect(v.loan.context.flatMap((c) => c.sourceIds)).toEqual(["aa-fy25", "rbi-digital-lending"]);
      const claims = [v.loan.consent, v.loan.partnership, ...v.loan.context, ...v.loan.assumptions, ...v.trust.factors.map((f) => f.claim)];
      expect(citedSourceIds(claims)).toEqual(expect.arrayContaining(["aa-fy25", "rbi-digital-lending"]));
    }
  });

  it("lists each flag with its trip id and a link to the trip", () => {
    for (const v of VIEWS) {
      for (const f of v.flagList) {
        expect(f.href).toBe(`/trips/${f.tripId}`);
        expect(f.id.startsWith(f.tripId)).toBe(true);
      }
    }
  });

  it("is deterministic", () => {
    for (const r of ROWS) expect(view(r.plate)).toEqual(view(r.plate));
  });

  it("uses only accepted wording", () => {
    const text = JSON.stringify(VIEWS);
    expect(text).not.toMatch(/\b(theft|stolen|steal|thief)\b/i);
  });
});
