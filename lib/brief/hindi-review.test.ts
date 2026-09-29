import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hindiReviewMarkdown } from "./hindi-review";

const DOC = join(__dirname, "..", "..", "docs", "exec", "hindi-review.md");

describe("docs/exec/hindi-review.md (TKT-06 DoD)", () => {
  const md = hindiReviewMarkdown();
  if (process.env.UPDATE_HINDI_REVIEW === "1") writeFileSync(DOC, md);

  it("is generated and up to date with the templates and dictionaries", () => {
    expect(existsSync(DOC)).toBe(true);
    expect(readFileSync(DOC, "utf8")).toBe(md);
  });

  it("lists the templates, the confidence words, the time words, place and driver names and the evidence lines", () => {
    expect(md).toContain("बहरोड़ के पास खड़े ट्रक में 38 L डीज़ल का हिसाब नहीं — रात 2:14 बजे");
    expect(md).toContain("<b>RJ14 GB 4521</b> — बहरोड़ के पास, रात 2:14, खड़े ट्रक में 38 L डीज़ल कम। ₹3,420 · <b>पक्का</b>");
    for (const w of ["पक्का", "शायद", "जाँचें", "रात 3:59", "सुबह 4:00", "दोपहर 12:00", "शाम 4:00", "रात 9:00"]) expect(md).toContain(w);
    expect(md).toContain("किशनगढ़");
    expect(md).toContain("रमेश कुमार");
    expect(md).toContain("26 मिनट में फ़्यूल 168 → 130 लीटर गिरा");
    expect(md).not.toMatch(/चोर|चुरा|\b(theft|stolen|thief)\b/i);
  });

  it("lists the Hindi phone menu and Ask drawer (EXE23)", () => {
    expect(md).toContain("## 8. Phone menu");
    expect(md).toContain("## 9. Ask drawer");
    for (const w of ["सुबह का हिसाब", "Urja क्यों", "मेनू", "Urja से पूछें", "आपका सवाल", "Gemini से पूछ रहे हैं…", "बहरोड़ वाले हिस्से के सारे फ़्लैग दिखाएँ"]) expect(md).toContain(w);
    expect(md).toContain("212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · Gemini 3.5 Flash · 1.8 सेकंड में जवाब · Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें।");
  });
});
