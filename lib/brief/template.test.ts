/**
 * TC-015 · the brief and the 7 AM message in Hindi and English. The template
 * output for 27 Sep must equal the mockup's data-hi / data-en strings
 * (final/brief.html, final/message.html), with every number computed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  hiVerb,
  messageClean,
  messageIntro,
  previewTitle,
  r1Text,
  renderBrief,
  renderMessage,
  richToHtml,
  type BriefCopy,
  type Lang,
  type MessageCopy,
} from "./template";

const DAY = "2026-09-27";
const FINAL = join(__dirname, "..", "..", ".design", "exploration", "final");

/** Every bilingual attribute value in a mockup, in document order, for one language. */
function mockupStrings(file: string, lang: Lang): string[] {
  const html = readFileSync(join(FINAL, file), "utf8");
  const attr = new RegExp(`data-(?:${lang}|${lang}-label|ph-${lang})="([^"]*)"`, "g");
  return [...html.matchAll(attr)].map((m) => m[1]);
}

/** The brief's copy in the mockup's document order. */
function briefInMockupOrder(c: BriefCopy): string[] {
  return [
    c.greet,
    c.date,
    c.earned.label,
    c.earned.span,
    c.earned.chartLabel,
    c.leak.text,
    c.itemsHead,
    ...c.items.flatMap((i) => [i.text, i.confidenceWord, i.status, i.go]),
    richToHtml(c.clean!),
    c.month.flaggedLabel,
    c.month.recoveredLabel,
    c.month.weeksLabel,
    c.month.cap,
    c.ask.label,
    c.ask.placeholder,
    c.ask.button,
  ];
}

/** The message's copy in the mockup's document order. */
function messageInMockupOrder(c: MessageCopy): string[] {
  return [
    c.account,
    c.day,
    c.preview.title,
    c.preview.meta,
    c.headline,
    c.intro,
    ...c.items.map(richToHtml),
    c.clean!,
    c.open,
    c.replies[0].text,
    c.replies[1].text,
    c.caption,
  ];
}

describe.each(["hi", "en"] as const)("TC-015 · renderBrief('%s') for 27 Sep", (lang) => {
  const c = renderBrief(DAY, lang);

  it("equals every data-%s string in final/brief.html, in order", () => {
    expect(briefInMockupOrder(c)).toEqual(mockupStrings("brief.html", lang));
  });

  it("carries the computed amounts and the three items in eye order, linked to their trips", () => {
    expect(c.lang).toBe(lang);
    expect(c.earned.inr).toBe(186400);
    expect(c.leak.inr).toBe(11430);
    expect(c.items.map((i) => [i.tripId, i.plate, i.inr, i.confidence, i.href])).toEqual([
      ["0926-04", "RJ14 GB 4521", 3420, "high", "/trips/0926-04"],
      ["0927-02", "RJ14 GA 1182", 4500, "likely", "/trips/0927-02"],
      ["0926-11", "RJ14 GC 3309", 3510, "check", "/trips/0926-11"],
    ]);
    expect(c.month.flaggedInr).toBe(58240);
    expect(c.month.recoveredInr).toBe(21600);
    expect(c.filter).toBeNull();
  });
});

describe.each(["hi", "en"] as const)("TC-015 · renderMessage('%s') for 27 Sep", (lang) => {
  const c = renderMessage(DAY, lang);

  it("equals every data-%s string in final/message.html, in order", () => {
    expect(messageInMockupOrder(c)).toEqual(mockupStrings("message.html", lang));
  });

  it("links the quick replies per §5.5 and stamps the message 7:00", () => {
    const en = lang === "en" ? "&lang=en" : "";
    expect(c.replies.map((r) => r.href)).toEqual(["/trips/0926-04#driver", `/brief?only=high${en}`]);
    expect(c.time).toBe("7:00");
    expect(c.briefHref).toBe(lang === "en" ? "/brief?lang=en" : "/brief");
  });
});

describe("TC-015 · the examples, the titles and the confidence words", () => {
  const hi = renderBrief(DAY, "hi");
  const en = renderBrief(DAY, "en");

  it("reads the TC-015 examples", () => {
    expect(hi.items[0].text).toBe("बहरोड़ के पास खड़े ट्रक में 38 L डीज़ल का हिसाब नहीं — रात 2:14 बजे");
    expect(en.items[1].text).toBe("Fuel bill says 250 L, but the tank rose only 200 L — Kishangarh");
    expect(hi.items.map((i) => i.confidenceWord)).toEqual(["पक्का", "शायद", "जाँचें"]);
    expect(richToHtml(hi.clean!).replace(/<\/?b>/g, "")).toContain("बाकी 14 ट्रिप का हिसाब ठीक है");
  });

  it("titles the pages as TC-027 expects", () => {
    expect(hi.title).toBe("सुबह का हिसाब · Urja");
    expect(en.title).toBe("Morning brief · Urja");
    expect(renderMessage(DAY, "hi").title).toBe("सुबह 7 बजे का संदेश · Urja");
    expect(renderMessage(DAY, "en").title).toBe("7 AM message · Urja");
  });

  it("has a page heading and a localised month card label in each language", () => {
    expect(hi.heading).toBe("सुबह का हिसाब");
    expect(en.heading).toBe("Morning brief");
    expect(en.month.ariaLabel).toBe("September so far");
    expect(hi.month.ariaLabel).toBe("सितंबर अब तक");
  });

  it("keeps the 14-day chart's label honest about yesterday's rank", () => {
    // 27 Sep (₹1,86,400) is second only to 24 Sep (₹1,94,800) in 14–27 Sep.
    expect(en.earned.chartLabel).toBe("Profit over the last 14 days; yesterday was one of the highest");
  });
});

describe("?only=high", () => {
  it("keeps only the High items and says how to see all of them", () => {
    for (const lang of ["hi", "en"] as const) {
      const c = renderBrief(DAY, lang, { onlyHigh: true });
      expect(c.items.map((i) => i.tripId)).toEqual(["0926-04"]);
      expect(c.filter).not.toBeNull();
    }
    const en = renderBrief(DAY, "en", { onlyHigh: true });
    expect(en.itemsHead).toBe("Look at this trip");
    expect(en.filter).toEqual({ text: "Showing only high ones", showAll: "Show all 3", href: "/brief?lang=en" });
    const hi = renderBrief(DAY, "hi", { onlyHigh: true });
    expect(hi.itemsHead).toBe("इस ट्रिप को देखें");
    expect(hi.filter!.href).toBe("/brief");
    // The day's totals don't change with the filter.
    expect(en.leak.text).toBe("doesn’t add up · across 3 trips");
    expect(richToHtml(en.clean!)).toBe("The other <b>14 trips</b> add up — diesel, tolls and km all match.");
  });
});

describe("the brief on another day", () => {
  it("reads 24 Sep, the clean day, with no items and every trip adding up", () => {
    const en = renderBrief("2026-09-24", "en");
    expect(en.earned.inr).toBe(194800);
    // Nothing unaccounted: the "everything adds up" variant, not "₹0 doesn't add up · across 0 trips".
    expect(en.leak).toEqual({ inr: 0, text: "Everything adds up", clean: true });
    expect(renderBrief("2026-09-24", "hi").leak).toEqual({ inr: 0, text: "सारा हिसाब ठीक है", clean: true });
    expect(renderBrief(DAY, "en").leak.clean).toBe(false);
    expect(en.items).toEqual([]);
    expect(richToHtml(en.clean!)).toBe("All <b>17 trips</b> add up — diesel, tolls and km all match.");
    expect(en.earned.chartLabel).toBe("Profit over the last 14 days; yesterday was the highest");
    expect(en.date).toBe("Friday, 25 September · yesterday’s 17 trips reconciled");
    expect(renderBrief("2026-09-24", "hi").date).toBe("शुक्रवार, 25 सितंबर · कल की 17 ट्रिप का हिसाब");
  });
});

describe("wording", () => {
  it("never accuses, in any rendered string", () => {
    const all = JSON.stringify([
      ...(["hi", "en"] as const).flatMap((l) => [renderBrief(DAY, l), renderMessage(DAY, l), renderBrief(DAY, l, { onlyHigh: true })]),
    ]);
    expect(all).not.toMatch(/\b(theft|thief|stolen|stole|steal)\b|चोर|चुरा/i);
  });
});

describe("Hindi agreement and the shared template pieces", () => {
  it("hiVerb picks the singular for exactly one", () => {
    expect(hiVerb(1, "हुई", "हुईं")).toBe("हुई");
    expect(hiVerb(0, "हुई", "हुईं")).toBe("हुईं");
    expect(hiVerb(17, "है", "हैं")).toBe("हैं");
  });

  it("agrees in number: 1 ट्रिप पूरी हुई, बाकी 1 ट्रिप ठीक है", () => {
    expect(messageIntro(1, 1, "hi")).toBe("1 ट्रिप पूरी हुई। इसे देखें:");
    expect(messageIntro(17, 3, "hi")).toBe("17 ट्रिप पूरी हुईं। इन 3 को देखें:");
    expect(messageIntro(1, 0, "en")).toBe("1 trip finished.");
    expect(messageClean(2, 1, "hi")).toBe("बाकी 1 ट्रिप ठीक है ✓");
    expect(messageClean(1, 0, "hi")).toBe("सभी 1 ट्रिप ठीक है ✓");
    expect(messageClean(17, 3, "hi")).toBe("बाकी 14 ट्रिप ठीक हैं ✓");
    expect(messageClean(2, 1, "en")).toBe("The other trip is fine ✓");
    expect(messageClean(3, 3, "en")).toBeNull();
  });

  it("the preview title follows the top flag's kind", () => {
    expect(previewTitle(true, "hi")).toBe("डीज़ल कहाँ गया?");
    expect(previewTitle(false, "en")).toBe("Where did the money go?");
  });

  it("an R1 drop with the ignition on reads 'standing' / 'रुके'", () => {
    const parts = { litres: 38, place: { hi: "बहरोड़", en: "Behror" }, parked: false, at: 0 };
    expect(r1Text(parts, "hi", "brief")).toMatch(/^बहरोड़ के पास रुके ट्रक में 38 L डीज़ल का हिसाब नहीं — .+ बजे$/);
    expect(r1Text(parts, "en", "message")).toMatch(/^38 L diesel down while standing near Behror, /);
    expect(r1Text({ ...parts, place: null, parked: true }, "en", "brief")).toMatch(/^38 L diesel unaccounted while parked, /);
  });
});
