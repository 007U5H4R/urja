/**
 * TC-046 · Fallback intents. Expected numbers are written here from
 * HANDOFF.md and technical-plan §4.3 (the eval's oracle), never computed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getAskContext } from "./context";
import { SAVED_MESSAGE, fallbackAnswer } from "./fallback";
import { unsupportedNumbers } from "./guard";
import { detectLang, matchIntent, normaliseQuestion, type IntentId } from "./intents";
import { FORBIDDEN } from "./text";

interface EvalCase {
  id: string;
  kind: "prepared" | "offtopic";
  input: { question: string };
  expected_sources: string[];
  expected_lang: "hi" | "en" | "any";
}
const dataset = JSON.parse(readFileSync(join(__dirname, "..", "..", "evals", "eval-dataset.json"), "utf8")) as { cases: EvalCase[] };
const byId = new Map(dataset.cases.map((c) => [c.id, c]));

/** Normalises an answer the way the eval scorer does: ASCII digits, no grouping commas. */
const plain = (s: string) => normaliseQuestion(s).replace(/(\d),(?=\d)/g, "$1");

interface Expect {
  intent: IntentId;
  /** Substrings the answer must contain after `plain()` (ASCII digits, no commas, lowercase). */
  has: string[];
  cites: string[];
  lang: "hi" | "en";
  paraphrase: string;
}

const EXPECT: Record<string, Expect> = {
  "EVAL-001": {
    intent: "driver_most_diesel",
    has: ["anil", "rj14 gc 3309", "125 l", "₹11250"],
    cites: ["0926-11", "0917-06", "0909-03"],
    lang: "en",
    paraphrase: "Which driver used the most extra diesel in September?",
  },
  "EVAL-002": {
    intent: "last_week_diesel",
    has: ["217 लीटर", "₹19530", "5 ट्रिप"],
    cites: ["0921-09", "0923-02", "0926-04", "0927-02", "0926-11"],
    lang: "hi",
    paraphrase: "पिछले हफ्ते कितने लीटर डीजल का हिसाब नहीं मिला?",
  },
  "EVAL-003": {
    intent: "least_per_km",
    has: ["rj14 gc 3309", "₹12.7", "anil", "125 l", "₹11250"],
    cites: ["0926-11", "0917-06", "0909-03"],
    lang: "en",
    paraphrase: "Which truck has the lowest profit per km?",
  },
  "EVAL-004": {
    intent: "behror_flags",
    has: ["5 flags", "0905-03", "0912-05", "0921-09", "0923-02", "0926-04", "237 l"],
    cites: ["0905-03", "0912-05", "0921-09", "0923-02", "0926-04"],
    lang: "en",
    paraphrase: "List the flags near Behror this month",
  },
  "EVAL-005": {
    intent: "yesterday_summary",
    has: ["₹186400", "₹11430", "3 trips"],
    cites: ["0926-04", "0927-02", "0926-11"],
    lang: "en",
    paraphrase: "What did we make yesterday and what's unaccounted?",
  },
  "EVAL-006": {
    intent: "truck_flags",
    has: ["0926-04", "38 l", "₹3420", "behror", "2:14"],
    cites: ["0926-04"],
    lang: "en",
    paraphrase: "What happened to Ramesh's truck last night?",
  },
  "EVAL-007": {
    intent: "recovered",
    has: ["₹21600", "₹58240", "37%"],
    cites: [],
    lang: "en",
    paraphrase: "How much money did we get back in September?",
  },
  "EVAL-008": {
    intent: "wrong_rate",
    has: ["2 of 23", "9%", "10%"],
    cites: ["0909-07", "0920-06"],
    lang: "en",
    paraphrase: "How many flags turned out wrong this month?",
  },
  "EVAL-009": {
    intent: "best_per_km",
    has: ["rj14 gc 7710", "₹31.8", "महेश"],
    cites: [],
    lang: "hi",
    paraphrase: "सबसे अधिक कमाई प्रति km वाला ट्रक कौन सा है?",
  },
  "EVAL-010": {
    intent: "truck_flags",
    has: ["0927-02", "250 l", "200 l", "₹4500", "kishangarh"],
    cites: ["0927-02"],
    lang: "en",
    paraphrase: "Vikram ki kal ki trip mein kya problem hai?",
  },
};

const { allowed } = getAskContext();

function checkAnswer(question: string, e: Expect) {
  const a = fallbackAnswer(question);
  expect(a, question).not.toBeNull();
  if (!a) return;
  expect(a.intent).toBe(e.intent);
  expect(a.lang).toBe(e.lang);
  const text = plain(a.answer);
  for (const h of e.has) expect(text, `${question} → ${a.answer}`).toContain(h);
  expect([...a.cites].sort()).toEqual([...e.cites].sort());
  expect(a.answer).not.toMatch(FORBIDDEN);
  expect(unsupportedNumbers(a.answer, allowed, "")).toEqual([]);
}

describe("TC-046 · fallback intents answer the 10 prepared questions", () => {
  it("covers exactly EVAL-001..010 from the dataset", () => {
    const prepared = dataset.cases.filter((c) => c.kind === "prepared").map((c) => c.id);
    expect(prepared).toEqual(Object.keys(EXPECT));
  });

  for (const [id, e] of Object.entries(EXPECT)) {
    it(`${id}: the dataset question maps to ${e.intent} with the golden numbers`, () => {
      const c = byId.get(id);
      expect(c).toBeDefined();
      if (!c) return;
      expect(matchIntent(c.input.question)?.id).toBe(e.intent);
      checkAnswer(c.input.question, e);
      for (const src of c.expected_sources) expect(fallbackAnswer(c.input.question)?.cites).toContain(src);
    });

    it(`${id}: a close paraphrase maps to ${e.intent} too`, () => {
      expect(matchIntent(e.paraphrase)?.id).toBe(e.intent);
      checkAnswer(e.paraphrase, e);
    });
  }

  it("EVAL-002 exactly: 217 L, ₹19,530, 5 trips, in Devanagari and never 'missing' wording", () => {
    const a = fallbackAnswer("पिछले हफ़्ते कितना डीज़ल गायब हुआ?");
    expect(a?.lang).toBe("hi");
    expect(a?.answer).toContain("217 लीटर");
    expect(a?.answer).toContain("₹19,530");
    expect(a?.answer).toContain("5 ट्रिप");
    expect(a?.answer).toContain("हिसाब नहीं मिल रहा");
    expect(a?.cites).toHaveLength(5);
  });

  it("the Hinglish question maps to trip 0927-02", () => {
    const a = fallbackAnswer("Vikram ki kal wali trip mein kya gadbad hai?");
    expect(a?.intent).toBe("truck_flags");
    expect(a?.cites).toEqual(["0927-02"]);
    expect(detectLang("Vikram ki kal wali trip mein kya gadbad hai?")).toBe("hinglish");
  });
});

describe("Review focus #2 · odd input", () => {
  it("normalises Devanagari digits and nukta forms", () => {
    expect(normaliseQuestion("१२५ लीटर")).toBe("125 लीटर");
    expect(normaliseQuestion("पिछले हफ़्ते डीज़ल")).toBe(normaliseQuestion("पिछले हफ्ते डीजल"));
  });

  it("finds a truck by a plate written with Devanagari digits", () => {
    const a = fallbackAnswer("RJ14 GB ४५२१ के साथ कल रात क्या हुआ?");
    expect(a?.intent).toBe("truck_flags");
    expect(a?.lang).toBe("hi");
    expect(a?.cites).toEqual(["0926-04"]);
    expect(a?.answer).toContain("38 लीटर");
  });

  it("detects the question's language", () => {
    expect(detectLang("Which truck earns least per km?")).toBe("en");
    expect(detectLang("सबसे ज़्यादा कमाई किसकी है?")).toBe("hi");
    expect(detectLang("Sabse zyada diesel kisne khaya?")).toBe("hinglish");
    expect(detectLang("kal mausam kaisa rahega")).toBe("hinglish");
    expect(detectLang("Diesel ka bhav kya hoga?")).toBe("hinglish");
    expect(detectLang("How was the weather yesterday?")).toBe("en");
  });

  it("answers a truck with no flag yesterday honestly, and a truck with none in September", () => {
    const y = fallbackAnswer("What happened with RJ14 GC 7710 yesterday?");
    expect(y?.intent).toBe("truck_flags");
    expect(y?.answer).toMatch(/no flag/i);
    const m = fallbackAnswer("Any flags on Mahesh's truck?");
    expect(m?.answer).toMatch(/no flag/i);
    expect(m?.cites).toEqual([]);
  });

  it("lists a truck's September flags when no day is named", () => {
    const a = fallbackAnswer("Show Anil's flags");
    expect(a?.cites.sort()).toEqual(["0909-03", "0917-06", "0926-11"]);
    expect(plain(a?.answer ?? "")).toContain("check");
  });
});

describe("unrecognised and off-topic questions are saved, not answered", () => {
  it.each(["EVAL-011", "EVAL-012", "EVAL-013"])("%s → no intent", (id) => {
    const q = byId.get(id)?.input.question ?? "";
    expect(q.length).toBeGreaterThan(0);
    expect(matchIntent(q)).toBeNull();
    expect(fallbackAnswer(q)).toBeNull();
  });

  it.each(["hello", "kal mausam kaisa rahega", "Kal diesel ka bhav kitna hoga?", "<script>alert(1)</script>", "What is the capital of France?", "diesel?"])("%s → no intent", (q) => {
    expect(fallbackAnswer(q)).toBeNull();
  });

  it("has the saved message in English and Hindi", () => {
    expect(SAVED_MESSAGE.en).toBe("Your question is saved. Try again in a minute for a written answer.");
    expect(SAVED_MESSAGE.hi).toMatch(/[ऀ-ॿ]/);
  });
});
