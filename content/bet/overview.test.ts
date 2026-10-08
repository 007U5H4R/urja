import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFlagLabView } from "@/lib/bet/views/flag-lab";
import { BET_OVERVIEW } from "./copy";
import { BOARD_COPY, DROPPED } from "./board";
import { hypothesisClaims } from "./hypotheses";
import { HYPE, STRUCTURAL } from "./hype";
import { METRICS_COPY, NORTH_STAR, metricTargets } from "./metrics";
import {
  AUTONOMY,
  BOARD_INTRO,
  HEADLINES,
  LOOP,
  OVERVIEW_SECTIONS,
  TEASERS,
  TENX,
  deferredAssumptions,
  marketClaims,
  overviewSummaryClaims,
  planClaims,
  productClaims,
} from "./overview";
import { ROADMAP_COPY } from "./roadmap";
import { citedSourceIds, isCited, sourceById, type Claim } from "./sources";

// TASK-28 · the /bet overview copy: the loop, the 5–10x, streams × autonomy, the teasers, and
// the page's claims in order.

function expectHonest(claim: Claim) {
  expect(claim.text.trim(), claim.text).not.toBe("");
  if (isCited(claim)) {
    expect(claim.sourceIds.length, claim.text).toBeGreaterThan(0);
    for (const id of claim.sourceIds) expect(() => sourceById(id), claim.text).not.toThrow();
  } else {
    expect(claim.assumption, claim.text).toBe(true);
    expect(claim.basis.trim(), claim.text).not.toBe("");
  }
}

describe("TASK-28 · overview copy", () => {
  it("keeps the h1 exactly 'Munshi → credit'", () => {
    expect(BET_OVERVIEW.h1).toBe("Munshi → credit");
  });

  it("TASK-32: names each section of the bet's tab pages once, with unique ids", () => {
    expect(OVERVIEW_SECTIONS.map((s) => s.id)).toEqual([
      "loop",
      "headlines",
      "start",
      "board",
      "shifts",
      "tenx",
      "autonomy",
      "roadmap",
      "metrics",
      "hypotheses",
    ]);
    for (const s of OVERVIEW_SECTIONS) expect(s.title.trim(), s.id).not.toBe("");
  });

  it("the loop runs close the books → verified truck-months → lending partnership → cheaper credit → the owner stays", () => {
    expect(LOOP.steps.map((s) => s.title)).toEqual([
      "Close the books daily",
      "Verified truck-months",
      "A consented lending partnership",
      "Cheaper credit",
      "The owner stays",
    ]);
    expect(LOOP.caption).toMatch(/^The loop/);
    expect(LOOP.steps[1].line).toContain("25 verified days");
  });

  it("the 5–10x has bet-spec §3's four dimensions and multiples", () => {
    expect(TENX.rows.map((r) => `${r.dimension}: ${r.multiple}`)).toEqual([
      "Time to know a leak: ~30x faster",
      "Hardware to measure fuel: Removes the main barrier for the long tail",
      "What the owner gets: Changes the job, not the speed",
      "Credit access: Lower-risk loans",
    ]);
  });

  it("the showcases walk the levels the flag lab computes for each trip", () => {
    for (const s of AUTONOMY.showcases) {
      const view = getFlagLabView(s.tripId)!;
      expect(view, s.tripId).not.toBeNull();
      // A typed bill is the claim under test, not a witness, so its step isn't on the path.
      const levels = view.flags[0].steps.filter((st) => st.counts).map((st) => st.level);
      const path = levels.filter((l, i) => i === 0 || l !== levels[i - 1]);
      expect(path, s.tripId).toEqual(s.path);
    }
    // 0926-04: the camera adds the 2nd family that L4 needs.
    const steps = getFlagLabView("0926-04")!.flags[0].steps;
    expect(steps.at(-1)?.streamId).toBe("camera");
    expect(steps.at(-1)?.families).toBe(2);
  });

  it("EXE45: streams raise confidence; autonomy, not confidence, needs independent families to agree", () => {
    expect(AUTONOMY.confidenceLede).toBe(
      "Confidence rises as each stream rules out an innocent cause; autonomy needs independent families to agree. The truck's own tracker can reach High, but it counts as one family, so the L4 auto-hold also needs a second, independent family. A typed claim never vouches for itself.",
    );
    expect(AUTONOMY.confidenceHeading).toBe("Streams raise confidence; families unlock autonomy");
  });

  it("EXE45: no /bet copy says confidence needs independent families to agree", () => {
    const files = ["content/bet", "lib/bet", "lib/bet/views", "components/bet", "components/bet/overview"].flatMap((d) =>
      readdirSync(d)
        .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
        .map((f) => join(d, f)),
    );
    expect(files.length).toBeGreaterThan(20);
    const hits = files.filter((f) =>
      /confidence rises only|only (when|as|if) independent|independent families,? more confidence|independent families raise confidence/i.test(
        readFileSync(f, "utf8"),
      ),
    );
    expect(hits).toEqual([]);
  });

  it("the ladder is L1–L5 with the tier each unlocks, and links to the real flag", () => {
    expect(AUTONOMY.ladder.map((l) => `${l.id} ${l.tier}`)).toEqual(["L1 Free", "L2 Munshi", "L3 Pro", "L4 Autopilot", "L5 No tier yet"]);
    expect(AUTONOMY.ladder[3].gate).toBe("High and at least 2 independent families");
    expect(AUTONOMY.link).toMatchObject({ href: "/trips/0926-04#flag-lab", label: "See it on a real flag" });
  });

  it("the teasers link to the tiers page and the lender view", () => {
    expect(TEASERS.tiers.link.href).toBe("/bet/tiers");
    expect(TEASERS.lender.link.href).toBe(`/trucks/${TEASERS.lender.slug}`);
    expect(TEASERS.lender.slug).toBe("rj14-gb-4521");
  });

  it("TASK-32: the three headline figures come from content claims, each stated in its claim", () => {
    expect(HEADLINES).toHaveLength(3);
    for (const h of HEADLINES) {
      expectHonest(h.claim);
      expect(h.value.trim(), h.label).not.toBe("");
      expect(h.label.trim()).not.toBe("");
    }
    // The figure is the claim's own number, or the 5–10x's own multiple.
    expect(HEADLINES[0].claim.text).toContain(HEADLINES[0].value.replace(/^~/, ""));
    expect(TENX.rows[0].multiple.startsWith(HEADLINES[1].value)).toBe(true);
    expect(TENX.rows[0].claims).toContain(HEADLINES[1].claim);
    // Fix round 1: the speed figure says it is the 5–10x's speed row, not the whole 5–10x.
    expect(HEADLINES[1].label).toBe("faster to know a leak: the next morning, not month end (the speed row of the 5–10x)");
    expect(HEADLINES[1].label).toContain("5–10x");
    expect(HEADLINES[2].claim.text).toContain(HEADLINES[2].value.replace(/^>/, ""));
    for (const h of HEADLINES) expect(overviewSummaryClaims()).toContain(h.claim);
    // The overview cites at least one source, so it ends with its own Sources.
    expect(citedSourceIds(overviewSummaryClaims()).length).toBeGreaterThan(0);
  });

  it("TASK-32: the per-page claims together are exactly the old overview's claims; none is lost", () => {
    // The single /bet page's claims before TASK-32, in its page order.
    const before: Claim[] = [
      ...LOOP.claims,
      ...TENX.rows.flatMap((r) => r.claims),
      BOARD_INTRO.segment,
      ...BOARD_COPY.claims,
      ...DROPPED.flatMap((d) => d.claims),
      ...[...STRUCTURAL, ...HYPE].flatMap((i) => [i.mechanism, ...i.evidence]),
      ROADMAP_COPY.claim,
      ROADMAP_COPY.funding,
      ...NORTH_STAR.definition,
      ...metricTargets(),
      METRICS_COPY.claim,
      ...hypothesisClaims(),
    ];
    const after = [...overviewSummaryClaims(), ...marketClaims(), ...productClaims(), ...planClaims()];
    expect(new Set(after)).toEqual(new Set(before));
    expect(new Set(citedSourceIds(after))).toEqual(new Set(citedSourceIds(before)));
    for (const c of BET_OVERVIEW.claims) expect(marketClaims()).toContain(c);
  });

  it("TASK-32: every claim on every tab page is honest, and each page cites at least one source", () => {
    for (const claims of [overviewSummaryClaims(), marketClaims(), productClaims(), planClaims()]) {
      for (const c of claims) expectHonest(c);
      const ids = citedSourceIds(claims);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(() => sourceById(id)).not.toThrow();
    }
  });

  it("TASK-32: a page's deferred assumptions are its assumptions, once each, with their bases", () => {
    const list = deferredAssumptions(marketClaims());
    expect(list.length).toBeGreaterThan(5);
    expect(new Set(list).size).toBe(list.length);
    for (const c of list) {
      expect(isCited(c)).toBe(false);
      expect(marketClaims()).toContain(c);
    }
    expect(list).toEqual([...new Set(marketClaims().filter((c) => !isCited(c)))]);
  });
});
