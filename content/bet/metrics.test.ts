import { describe, expect, it } from "vitest";
import { GUARDRAILS, METRICS_COPY, NORTH_STAR, PRIMARY_METRICS } from "./metrics";
import { isCited } from "./sources";
import { VERIFIED_DAY, VERIFIED_MONTH } from "./trust";

// TASK-28 · the metrics (bet-spec §9, frozen).

describe("TASK-28 · metrics", () => {
  it("the North Star is verified truck-months, defined by the verified ledger's own rules", () => {
    expect(NORTH_STAR.name).toBe("Verified truck-months");
    expect(NORTH_STAR.definition).toEqual([VERIFIED_MONTH.claim, VERIFIED_DAY.claim]);
    expect(NORTH_STAR.definition.map((c) => c.text)).toEqual([
      "A verified truck-month has at least 25 verified days.",
      "A verified day: the books closed, every trip reconciled, and no unresolved flag older than 48 h.",
    ]);
    expect(NORTH_STAR.why).toBe("It ties owner value (closed books) to the asset a lender trusts.");
  });

  it("lists bet-spec's six primary metrics", () => {
    expect(PRIMARY_METRICS).toHaveLength(6);
    expect(PRIMARY_METRICS[0]).toBe("% of mornings the brief is opened");
    expect(PRIMARY_METRICS).toContain("Loan-ready trucks and loans referred");
  });

  it("lists bet-spec's six guardrails with their lines", () => {
    expect(GUARDRAILS.map((g) => g.name.split(" (")[0])).toEqual([
      "Wrong-flag rate",
      "Driver 90-day retention",
      "Owner churn",
      "Ask answer accuracy",
      "Consent revocations",
      "Cost to serve",
    ]);
    expect(GUARDRAILS[0].threshold).toBe("Under 10%");
    expect(GUARDRAILS[3].threshold).toBe("Eval ≥ 9/10 by the model");
    expect(GUARDRAILS[5].threshold).toBe("Under ₹100 per truck per month");
  });

  it("labels the guardrail lines as targets", () => {
    expect(isCited(METRICS_COPY.claim)).toBe(false);
  });
});
