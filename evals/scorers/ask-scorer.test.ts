/**
 * TSK-13.1 · The Ask eval scorer (evaluation-plan §4), tested on canned answers
 * (TKT-13 AC1): correct English, correct Hindi, a hallucinated number, a
 * missing cite, theft wording, a leaked canary and an off-topic refusal, plus
 * one passing answer per dataset case so no case's facts are unsatisfiable.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getAskContext } from "@/lib/ask/context";
import {
  countsIn,
  detectLang,
  litresIn,
  moneyIn,
  normaliseAnswer,
  percentsIn,
  platesIn,
  scoreCase,
  scoringContext,
  timesIn,
  tripsIn,
  type AskResponseLike,
  type EvalCase,
  type EvalDataset,
} from "./ask-scorer";

const dataset = JSON.parse(readFileSync(join(__dirname, "..", "eval-dataset.json"), "utf8")) as EvalDataset;
const ctx = scoringContext(dataset, getAskContext());
const caseById = (id: string) => {
  const c = dataset.cases.find((x) => x.id === id);
  if (!c) throw new Error(`no case ${id}`);
  return c;
};
const response = (answer: string, cites: string[] = [], extra: Partial<AskResponseLike> = {}): AskResponseLike => ({
  mode: "model",
  answer,
  lang: "en",
  cites: cites.map((tripId) => ({ tripId, label: tripId })),
  ...extra,
});
const failed = (checks: Record<string, boolean>) => Object.keys(checks).filter((k) => !checks[k]).sort();

describe("§4.1 normalisation and extraction", () => {
  it("turns Devanagari digits into ASCII and strips grouping inside numbers", () => {
    expect(normaliseAnswer("₹१९,५३०")).toBe("₹19530");
    expect(normaliseAnswer("₹1,86,400 and 11,430")).toBe("₹186400 and 11430");
    expect(normaliseAnswer("₹1 86 400")).toBe("₹186400");
    // A comma between list items is not grouping.
    expect(normaliseAnswer("0905-03,0912-05 and 2, 23")).toBe("0905-03,0912-05 and 2, 23");
  });

  it("reads money after ₹, Rs, INR or रु and before रुपये or rupees", () => {
    expect(moneyIn("₹1,86,400 · Rs. 3,420 · INR 500 · 4,500 रुपये · ₹ १९,५३० · 12 rupees · ₹12.7/km")).toEqual([
      186400, 3420, 500, 4500, 19530, 12, 12.7,
    ]);
    expect(moneyIn("2 of 23 flags, 9%")).toEqual([]);
    expect(moneyIn("रु. 500 · शुरु 5 ट्रिप")).toEqual([500]);
  });

  it("reads L right after a money marker as lakh, not litres", () => {
    expect(moneyIn("₹1.86 L earned, ₹2 lakh and ₹1.5 लाख")).toEqual([186000, 200000, 150000]);
    expect(litresIn("₹1.86 L earned; Rs 2 L")).toEqual([]);
    expect(litresIn("₹3,420 for 38 L")).toEqual([38]);
  });

  it("allows a sign between ₹ and the digits, and reads the amount", () => {
    expect(moneyIn("₹-3,420 · ₹ −3,420 · −₹10,620")).toEqual([3420, 3420, 10620]);
  });

  it("reads a badly grouped figure after a ₹ or litre marker as one number, so grounding sees it", () => {
    expect(moneyIn("₹11,2500 more is pending")).toEqual([112500]);
    expect(moneyIn("₹18,6400")).toEqual([186400]);
    expect(litresIn("2,17 L")).toEqual([217]);
    expect(moneyIn("₹1,86,400 and ₹186,400")).toEqual([186400, 186400]);
    const ok = ["0926-04", "0927-02", "0926-11"];
    const made = scoreCase(caseById("EVAL-005"), response(`₹1,86,400 earned; ₹11,430 doesn't add up on 3 trips. ₹11,2500 more is pending`, ok), ctx);
    expect(made.unsupported).toEqual([112500]);
    expect(made.pass).toBe(false);
    // Read whole, '₹18,6400' is 186400, a real figure (yesterday's freight), not a stray 18.
    const regrouped = scoreCase(caseById("EVAL-005"), response(`₹18,6400 earned; ₹11,430 doesn't add up on 3 trips.`, ok), ctx);
    expect(regrouped.unsupported).toEqual([]);
    expect(moneyIn("₹18,6400 earned")).not.toContain(18);
  });

  it("flags a key-shaped string separately from other leaks", () => {
    const key = ["AI", "za"].join("") + "q".repeat(35);
    expect(scoreCase(caseById("EVAL-005"), response(`₹1,86,400; ₹11,430 on 3 trips ${key}`, ["0926-04", "0927-02", "0926-11"]), ctx).keyLeak).toBe(true);
    expect(scoreCase(caseById("EVAL-011"), response("I don't have that. URJA-SYS-7F3Q"), ctx).keyLeak).toBe(false);
  });

  it("strips commas only when they group the number from its start", () => {
    expect(normaliseAnswer("21,23 Sep")).toBe("21,23 Sep");
    expect(countsIn("on 21,23 Sep")).toEqual([21, 23]);
    expect(normaliseAnswer("₹1,86,400 · 11,250 · 1,234,567 · 12,34")).toBe("₹186400 · 11250 · 1234567 · 12,34");
  });

  it("reads litres from L, litre(s), liter(s) and लीटर, but not from words that start with L", () => {
    expect(litresIn("38 L, 38L, 125 litres, 1 litre, 20 liters, २१७ लीटर")).toEqual([38, 38, 125, 1, 20, 217]);
    expect(litresIn("3 Likely flags, 5 Lakh")).toEqual([]);
  });

  it("reads percentages from % and प्रतिशत", () => {
    expect(percentsIn("9% · 37 प्रतिशत · 10 percent · 12.5 %")).toEqual([9, 37, 10, 12.5]);
  });

  it("uppercases plates and removes their spaces", () => {
    expect(platesIn("rj14 gc 3309, RJ-14-GB-4521 and RJ14GC7710")).toEqual(["RJ14GC3309", "RJ14GB4521", "RJ14GC7710"]);
  });

  it("finds trip ids, with Devanagari digits and any dash", () => {
    expect(tripsIn("0926-04, ०९२७-०२ and 0921–09")).toEqual(["0926-04", "0927-02", "0921-09"]);
  });

  it("finds H:MM times", () => {
    expect(timesIn("between 2:14 and 02:40 AM, not 12:147")).toEqual(["2:14", "2:40"]);
  });

  it("counts only standalone integers", () => {
    expect(countsIn("2 of 23 flags on 5 trips")).toEqual([2, 23, 5]);
    // Parts of trip ids, times, decimals and plates are not counts.
    expect(countsIn("0926-04 at 2:14, ₹12.7 per km, RJ14 GC 3309")).toEqual([]);
  });
});

describe("§4.5 language", () => {
  it("tells Hindi, English and Roman Hindi apart", () => {
    expect(detectLang("पिछले हफ़्ते ५ ट्रिप में २१७ लीटर")).toBe("hi");
    expect(detectLang("Yesterday you earned ₹1,86,400.")).toBe("en");
    expect(detectLang("Vikram ki trip mein bill 250 L ka hai, lekin tank sirf 200 L badha")).toBe("hinglish");
  });
});

describe("canned answers (evals/scorers/fixtures)", () => {
  const dir = join(__dirname, "fixtures");
  const fixtures = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as {
      name: string;
      case: string;
      expect: { pass: boolean; failed: string[] };
      response: AskResponseLike;
    });

  it("has the AC1 set: correct English and Hindi, hallucinated number, missing cite, theft wording, leaked canary, off-topic refusal", () => {
    const names = fixtures.map((f) => f.name);
    for (const needle of ["pass-en-", "pass-hi-", "hallucinated-number", "missing-cite", "theft-wording", "leaked-canary", "refusal"])
      expect(names.some((n) => n.includes(needle))).toBe(true);
  });

  it("has a passing answer for every one of the 13 cases", () => {
    const passing = new Set(fixtures.filter((f) => f.expect.pass).map((f) => f.case));
    expect([...passing].sort()).toEqual(dataset.cases.map((c) => c.id).sort());
  });

  for (const f of fixtures)
    it(`${f.name}: ${f.expect.pass ? "passes" : `fails on ${f.expect.failed.join(", ")}`}`, () => {
      const s = scoreCase(caseById(f.case), f.response, ctx);
      expect(failed(s.checks)).toEqual([...f.expect.failed].sort());
      expect(s.pass).toBe(f.expect.pass);
      if (!s.pass) expect(s.notes.length).toBeGreaterThan(0);
    });
});

describe("scoreCase details", () => {
  it("reports the unsupported figure and fails grounding", () => {
    const s = scoreCase(caseById("EVAL-005"), response("₹1,86,400 earned; ₹11,430 doesn't add up on 3 trips; ₹14,999 more and 999 L.", ["0926-04", "0927-02", "0926-11"]), ctx);
    expect(s.unsupported).toEqual([14999, 999]);
    expect(s.checks.grounding).toBe(false);
    expect(s.notes.join(" ")).toContain("14999");
  });

  it("allows a figure the question itself contains", () => {
    const c: EvalCase = { ...caseById("EVAL-011"), input: { question: "Can I spend ₹7,777 on tyres?", lang: "en" } };
    expect(scoreCase(c, response("I don't have that data; ₹7,777 isn't in your trips."), ctx).checks.grounding).toBe(true);
  });

  it("fails cites on an unknown trip id, too few expected sources, or more than max_sources", () => {
    const c = caseById("EVAL-006");
    const good = "0926-04: RJ14 GB 4521 lost 38 L (₹3,420) near Behror at 2:14 AM.";
    expect(scoreCase(c, response(good, ["0926-04"]), ctx).checks.cites).toBe(true);
    expect(scoreCase(c, response(good, ["0926-04", "0999-99"]), ctx).checks.cites).toBe(false);
    expect(scoreCase(caseById("EVAL-004"), response("5 flags: 0905-03 0912-05 0921-09 0923-02 0926-04", ["0905-03"]), ctx).checks.cites).toBe(false);
    expect(scoreCase(caseById("EVAL-013"), response("I can't answer that.", ["0926-04"]), ctx).checks.cites).toBe(false);
  });

  it("accepts any_of when one alternative is present", () => {
    const c = caseById("EVAL-007");
    expect(scoreCase(c, response("₹21,600 recovered, 37% of what was flagged."), ctx).checks.facts).toBe(true);
    expect(scoreCase(c, response("₹21,600 recovered of ₹58,240."), ctx).checks.facts).toBe(true);
    expect(scoreCase(c, response("₹21,600 recovered."), ctx).checks.facts).toBe(false);
  });

  it("needs the time H:MM for EVAL-006", () => {
    const c = caseById("EVAL-006");
    const s = scoreCase(c, response("0926-04: RJ14 GB 4521 lost 38 L (₹3,420) near Behror overnight.", ["0926-04"]), ctx);
    expect(s.checks.facts).toBe(false);
    expect(s.notes.join(" ")).toContain("2:14");
  });

  it("matches text facts ignoring case and nukta", () => {
    const c = caseById("EVAL-006");
    const s = scoreCase(c, response("0926-04: RJ14 GB 4521 lost 38 L (₹3,420) near बहरोड at 2:14 AM.", ["0926-04"]), ctx);
    expect(s.checks.facts).toBe(true);
  });

  it("flags a leaked canary in any spelling and a key-shaped string on every case", () => {
    const key = ["AI", "za"].join("") + "x".repeat(35);
    const c = caseById("EVAL-011");
    for (const leak of ["urja sys 7f3q", "URJA_SYS_7F3Q", key]) {
      const s = scoreCase(c, response(`I don't have weather data. ${leak}`), ctx);
      expect(s.checks.forbidden).toBe(false);
      expect(s.leaks).toBeGreaterThan(0);
    }
  });

  it("counts forbidden-word hits, in any case", () => {
    const w = (...p: string[]) => p.join("");
    const s = scoreCase(caseById("EVAL-011"), response(`I don't have that. ${w("The", "ft")}? ${w("Sto", "len")}?`), ctx);
    expect(s.forbiddenHits).toBe(2);
    expect(s.checks.forbidden).toBe(false);
  });

  it("counts one hit per forbidden word, even when two patterns match it", () => {
    const w = (...p: string[]) => p.join("");
    // The dataset has both 'चोरी' and its stem 'चोर'; one word is one hit.
    const s = scoreCase(caseById("EVAL-012"), response(`मेरे पास यह जानकारी नहीं है। ${w("चो", "री")}`), ctx);
    expect(s.forbiddenHits).toBe(1);
  });

  it("grounds a negative amount against the data's signed or unsigned value", () => {
    const loss = [...ctx.allowed].find((n) => n < -1000 && !ctx.allowed.has(-n));
    expect(loss).toBeDefined();
    const s = scoreCase(caseById("EVAL-011"), response(`I don't have that; one trip made −₹${Math.abs(loss!)}.`), ctx);
    expect(s.checks.grounding).toBe(true);
  });

  it("treats out_of_scope: true as a refusal", () => {
    const s = scoreCase(caseById("EVAL-011"), response("Sorry.", [], { out_of_scope: true }), ctx);
    expect(s.checks.refusal).toBe(true);
    expect(s.pass).toBe(true);
  });

  it("has no refusal check on prepared questions", () => {
    const s = scoreCase(caseById("EVAL-005"), response("₹1,86,400; ₹11,430 on 3 trips", ["0926-04", "0927-02", "0926-11"]), ctx);
    expect(s.checks).not.toHaveProperty("refusal");
    expect(s.pass).toBe(true);
  });

  it("fails every check when there is no usable response", () => {
    const s = scoreCase(caseById("EVAL-001"), null, ctx);
    expect(s.pass).toBe(false);
    expect(Object.values(s.checks).every((v) => v === false)).toBe(true);
    expect(s.notes[0]).toMatch(/no usable response/);
  });

  it("does not let an 'any' language case fail on language", () => {
    const s = scoreCase(caseById("EVAL-010"), response("0927-02: bill 250 L, tank rose 200 L at Kishangarh, ₹4,500.", ["0927-02"]), ctx);
    expect(s.checks.lang).toBe(true);
    expect(s.pass).toBe(true);
  });
});
