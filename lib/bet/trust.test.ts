import { describe, expect, it } from "vitest";
import { FLEET } from "@/lib/data/fleet";
import { SOURCES, isCited, sourceById } from "@/content/bet/sources";
import {
  GPS_GAP_MIN,
  LEAKAGE_ZERO_AT_SHARE,
  LOAN_ASSUMPTIONS,
  LOAN_CONSENT,
  LOAN_CONTEXT,
  LOAN_PARTNERSHIP,
  STABILITY_ZERO_AT_CV,
  TRUST_FACTORS,
  VERIFIED_DAY,
  VERIFIED_DAYS_TARGET,
  VERIFIED_MONTH,
} from "@/content/bet/trust";
import {
  completenessOf,
  leakageFactor,
  resolutionFactor,
  stabilityFactor,
  trustFor,
  trustScore,
  utilisationFactor,
  type TrustFactors,
} from "./trust";

const ONES: TrustFactors = { completeness: 1, resolution: 1, leakage: 1, stability: 1, utilisation: 1 };
const ZEROS: TrustFactors = { completeness: 0, resolution: 0, leakage: 0, stability: 0, utilisation: 0 };

describe("trust-score content (TASK-23, bet-spec §8)", () => {
  it("has the five §8 factors, in order, with weights that sum to 100", () => {
    expect(TRUST_FACTORS.map((f) => [f.id, f.weight])).toEqual([
      ["completeness", 30],
      ["resolution", 25],
      ["leakage", 20],
      ["stability", 15],
      ["utilisation", 10],
    ]);
    expect(TRUST_FACTORS.reduce((a, f) => a + f.weight, 0)).toBe(100);
  });

  it("labels every factor, the verified-day rules and the loan assumptions as assumptions with a basis", () => {
    const claims = [
      ...TRUST_FACTORS.map((f) => f.claim),
      VERIFIED_DAY.claim,
      VERIFIED_MONTH.claim,
      VERIFIED_DAYS_TARGET.claim,
      LEAKAGE_ZERO_AT_SHARE.claim,
      STABILITY_ZERO_AT_CV.claim,
      LOAN_ASSUMPTIONS.emiHeadroom.claim,
      LOAN_ASSUMPTIONS.tenor.claim,
    ];
    for (const c of claims) {
      expect(c.text.trim()).not.toBe("");
      expect(isCited(c)).toBe(false);
      if (!isCited(c)) expect(c.basis.trim()).not.toBe("");
    }
  });

  it("the leakage zero point sits above the cited ~8%, and its citation lives in sourceIds, not in the text", () => {
    const c = LEAKAGE_ZERO_AT_SHARE.claim;
    if (isCited(c)) throw new Error("the leakage zero point is an assumption");
    expect(c.basis).toMatch(/8%/);
    expect(c.basis).toMatch(/10%/);
    expect(c.basis).not.toMatch(/should earn nothing/);
    const visible = [c.text, c.basis, LEAKAGE_ZERO_AT_SHARE.benchmark.text].join(" ");
    for (const s of SOURCES) expect(visible).not.toContain(s.id);
    expect(LEAKAGE_ZERO_AT_SHARE.benchmark.sourceIds).toEqual(["fuel-leakage-8pct"]);
    expect(() => LEAKAGE_ZERO_AT_SHARE.benchmark.sourceIds.forEach(sourceById)).not.toThrow();
  });

  it("the consent step and the partnership are our design, labelled as assumptions; only the sources' own facts are cited", () => {
    for (const c of [LOAN_CONSENT, LOAN_PARTNERSHIP]) {
      expect(isCited(c)).toBe(false);
      if (!isCited(c)) expect(c.basis).toMatch(/not built|no lending partner/);
    }
    expect(LOAN_CONSENT.text).toMatch(/Account Aggregator/);
    expect(LOAN_CONSENT.text).toMatch(/DPDP/);
    expect(LOAN_CONTEXT.map((c) => c.sourceIds)).toEqual([["aa-fy25"], ["rbi-digital-lending"]]);
    for (const c of LOAN_CONTEXT) expect(() => c.sourceIds.forEach(sourceById)).not.toThrow();
  });

  it("the EMI-headroom and tenor bases claim no outside fact without a source", () => {
    for (const c of [LOAN_ASSUMPTIONS.emiHeadroom.claim, LOAN_ASSUMPTIONS.tenor.claim]) {
      if (isCited(c)) throw new Error("the loan assumptions are assumptions");
      expect(c.basis).toMatch(/^Our assumption, not yet sourced: /);
      expect(c.basis).toMatch(/To be set with a lending partner\.$/);
      expect(c.basis).not.toMatch(/commonly|often|\d+–\d+%/);
    }
    expect(LOAN_ASSUMPTIONS.emiHeadroom.share).toBe(0.4);
    expect(LOAN_ASSUMPTIONS.tenor.months).toBe(48);
  });

  it("freezes the §8 numbers: 48 h, 25 days a month, 180 days, a 5-minute gap", () => {
    expect(VERIFIED_DAY.resolveWithinH).toBe(48);
    expect(VERIFIED_MONTH.minDays).toBe(25);
    expect(VERIFIED_DAYS_TARGET.days).toBe(180);
    expect(GPS_GAP_MIN).toBe(5);
    expect(LOAN_ASSUMPTIONS.emiHeadroom.share).toBeGreaterThan(0);
    expect(LOAN_ASSUMPTIONS.emiHeadroom.share).toBeLessThan(1);
    expect(Number.isInteger(LOAN_ASSUMPTIONS.tenor.months)).toBe(true);
  });
});

describe("trust factors (TASK-23)", () => {
  it("completeness: the share of trip-minutes outside GPS gaps longer than 5 minutes", () => {
    const at = (ts: number[]) => ts.map((t) => ({ t }));
    // 0..10 every minute: no gap.
    expect(completenessOf([{ start: 0, end: 10, samples: at([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) }])).toBe(1);
    // A 5-minute gap is allowed; a 6-minute one is not.
    expect(completenessOf([{ start: 0, end: 10, samples: at([0, 5, 6, 7, 8, 9, 10]) }])).toBe(1);
    expect(completenessOf([{ start: 0, end: 10, samples: at([0, 1, 2, 3, 4, 10]) }])).toBeCloseTo(4 / 10);
    // Missing minutes at either end count as a gap too.
    expect(completenessOf([{ start: 0, end: 20, samples: at([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) }])).toBeCloseTo(10 / 20);
    expect(completenessOf([])).toBe(1);
  });

  it("resolution: overdue waiting flags lower it; resolved and young flags do not", () => {
    const h = 60;
    const asOf = 100 * h;
    expect(resolutionFactor([], asOf)).toBe(1);
    expect(resolutionFactor([{ status: "confirmed", at: 0 }, { status: "wrong", at: 0 }], asOf)).toBe(1);
    // "Older than 48 h" is strict: a flag exactly 48 h old is still on time.
    expect(resolutionFactor([{ status: "waiting", at: asOf - 48 * h }], asOf)).toBe(1);
    expect(resolutionFactor([{ status: "waiting", at: asOf - 49 * h }, { status: "confirmed", at: 0 }], asOf)).toBe(0.5);
  });

  it("leakage: 0% of diesel ₹ scores 1, the zero point and beyond score 0", () => {
    const zeroAt = LEAKAGE_ZERO_AT_SHARE.share;
    expect(leakageFactor(0, 100_000)).toBe(1);
    expect(leakageFactor(zeroAt * 100_000, 100_000)).toBe(0);
    expect(leakageFactor(2 * zeroAt * 100_000, 100_000)).toBe(0);
    expect(leakageFactor((zeroAt / 2) * 100_000, 100_000)).toBeCloseTo(0.5);
    expect(leakageFactor(0, 0)).toBe(1);
  });

  it("stability: equal weeks score 1; the CV zero point scores 0; a loss-making mean scores 0", () => {
    expect(stabilityFactor([5000, 5000, 5000, 5000])).toBe(1);
    expect(stabilityFactor([0, 0, 0, 0])).toBe(0);
    expect(stabilityFactor([-100, 50, 20, 10])).toBe(0);
    const v = stabilityFactor([4000, 6000, 4000, 6000]); // CV = 0.2
    expect(v).toBeCloseTo(1 - 0.2 / STABILITY_ZERO_AT_CV.cv);
  });

  it("utilisation: the share of days on the road, clamped to 0–1", () => {
    expect(utilisationFactor(27, 27)).toBe(1);
    expect(utilisationFactor(0, 27)).toBe(0);
    expect(utilisationFactor(9, 27)).toBeCloseTo(1 / 3);
    expect(utilisationFactor(0, 0)).toBe(0);
  });

  it("weights the factors into 0–100", () => {
    expect(trustScore(ONES)).toBe(100);
    expect(trustScore(ZEROS)).toBe(0);
    expect(trustScore({ ...ZEROS, completeness: 1 })).toBe(30);
    expect(trustScore({ ...ZEROS, resolution: 0.5, utilisation: 1 })).toBe(22.5);
  });

  it("is the sum of the per-factor points, each rounded to one decimal place", () => {
    // Raw Σ = 0.04 + 0.04 = 0.08 → 0.1; rounded rows 0.0 + 0.0 = 0.0.
    expect(trustScore({ ...ZEROS, completeness: 0.04 / 30, resolution: 0.04 / 25 })).toBe(0);
    // Rows 0.06 → 0.1 and 0.06 → 0.1 sum to 0.2; the raw Σ 0.12 would round to 0.1.
    expect(trustScore({ ...ZEROS, completeness: 0.06 / 30, resolution: 0.06 / 25 })).toBe(0.2);
  });

  it("every truck's factors are in 0–1 and its score in 0–100", () => {
    for (const t of FLEET) {
      const r = trustFor(t.plate);
      for (const v of Object.values(r.factors)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("is deterministic", () => {
    for (const t of FLEET) expect(trustFor(t.plate)).toEqual(trustFor(t.plate));
  });

  it("throws on a plate outside the fleet", () => {
    expect(() => trustFor("XX00 ZZ 0000")).toThrow();
  });
});
