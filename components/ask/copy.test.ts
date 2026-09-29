import { describe, expect, it } from "vitest";
import { matchIntent } from "@/lib/ask/intents";
import { ASK_CHIPS, ASK_COPY } from "./copy";

// EXE23: the drawer's copy in both languages, picked by the screen's language.

const FORBIDDEN = /चोर|चुरा|\b(theft|stolen|stole|thief)\b/i;
/** Every string of a copy, the templates filled with 7; `from` only wraps the scope, which is data. */
const strings = (c: (typeof ASK_COPY)["en"]) =>
  Object.entries(c)
    .filter(([k]) => k !== "from")
    .map(([, v]) => (typeof v === "function" ? (v as (x: never) => string)(7 as never) : v));

describe("Ask copy (EXE23)", () => {
  it("has the same keys in Hindi and English", () => {
    expect(Object.keys(ASK_COPY.hi).sort()).toEqual(Object.keys(ASK_COPY.en).sort());
  });

  it("every Hindi string is Devanagari, with no ₹ literal and no forbidden word", () => {
    for (const s of strings(ASK_COPY.hi)) {
      expect(s).toMatch(/[ऀ-ॿ]/);
      expect(s).not.toMatch(/₹/);
      expect(s).not.toMatch(FORBIDDEN);
    }
    for (const s of strings(ASK_COPY.en)) expect(s).not.toMatch(FORBIDDEN);
  });

  it("keeps the English chips of §6.6, and the Hindi chip text in both", () => {
    expect(ASK_CHIPS.en.map((c) => c.text)).toEqual([
      "Which truck earns least per km, and why?",
      "पिछले हफ़्ते कितना डीज़ल गायब हुआ?",
      "Show every flag on the Behror stretch",
    ]);
    expect(ASK_CHIPS.hi[1]).toEqual(ASK_CHIPS.en[1]);
    for (const c of ASK_CHIPS.hi) {
      expect(c.lang).toBe("hi");
      expect(c.text).toMatch(/[ऀ-ॿ]/);
      expect(c.text).not.toMatch(FORBIDDEN);
    }
  });

  it("each Hindi chip asks the same question as its English one (the fallback reads the same intent)", () => {
    const intents = (l: "hi" | "en") => ASK_CHIPS[l].map((c) => matchIntent(c.text)?.id ?? null);
    expect(intents("en")).toEqual(["least_per_km", "last_week_diesel", "behror_flags"]);
    expect(intents("hi")).toEqual(intents("en"));
  });

  it("cite chips name the trip in the screen's language, with the same id", () => {
    expect(ASK_COPY.en.citeChip("0926-04")).toBe("Trip 0926-04");
    expect(ASK_COPY.hi.citeChip("0926-04")).toBe("ट्रिप 0926-04");
  });

  it("the Hindi provenance scope reads '… के डेटा से'", () => {
    expect(ASK_COPY.hi.from("212 ट्रिप, 24 ट्रक, 1–27 सितंबर")).toBe("212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से");
  });
});
