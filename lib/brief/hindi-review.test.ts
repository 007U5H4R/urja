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

  it("records the AI pre-review (H1–H10) in its header and carries its wording", () => {
    expect(md).toContain("AI pre-review 2026-09-29 applied H1–H10; native review pending.");
    // H1: the English chip is English; the Hindi chip drops गायब.
    expect(md).toContain("| पिछले हफ़्ते कितने डीज़ल का हिसाब नहीं मिला? | How much diesel went unaccounted last week? |");
    expect(md).not.toContain("गायब");
    // H2: 'डेटा से' once in the fallback provenance line.
    expect(md).toContain("212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · AI के बिना, सीधा हिसाब · 0.04 सेकंड में जवाब · Urja ग़लत हो सकता है");
    // H3: फ़्लैग हुआ, not पकड़ा.
    expect(md).toContain("| सितंबर में फ़्लैग हुआ | Flagged in September |");
    expect(md).toContain("| हर हफ़्ते: फ़्लैग हुआ और वापस मिला |");
    expect(md).not.toContain("पकड़");
    // H4: the geofence lines end with a verb.
    expect(md).toContain("रात 12:59 से रात 3:25 तक 92.5 किमी तय रास्ते से हटकर चला |");
    // H5 and H6: टंकी, आम खपत, सीमा.
    expect(md).toContain("बिल में 250 लीटर (₹22,500); टंकी में 200 लीटर बढ़ा");
    for (const w of ["टैंक", "आम खर्च", "छूट"]) expect(md).not.toContain(w);
    expect(md).toContain("इस रूट पर इस ट्रक की आम खपत 187 लीटर है (20% ज़्यादा)");
    expect(md).toContain("12% की सीमा के करीब है");
    expect(md).toContain("6% की सीमा से काफ़ी ऊपर है");
    // H7: हिंदी या अंग्रेज़ी में, in the dock and the drawer.
    expect(md).toContain("| कुछ भी पूछें, हिंदी या अंग्रेज़ी में… |");
    expect(md).toContain("| हिंदी या अंग्रेज़ी में पूछें… |");
    expect(md).not.toContain("हिंदी या English");
    // H8: the chart labels say कमाई सबसे ज़्यादा.
    expect(md).toContain("| पिछले 14 दिन की कमाई, कल की कमाई सबसे ज़्यादा में से एक थी |");
    expect(md).toContain("| पिछले 2 दिन की कमाई, कल की कमाई सबसे ज़्यादा थी |");
    // H9: Indian digit grouping for km, in both languages.
    expect(md).toContain("| तय 1,150 किमी की जगह 1,412 किमी चला (+23%) | Drove 1,412 km against a planned 1,150 km (+23%) |");
    // H10: नीमराना एचपी पंप.
    expect(md).toContain("| नीमराना एचपी पंप | HP pump Neemrana |");
  });

  it("lists the Hindi phone menu and Ask drawer (EXE23)", () => {
    expect(md).toContain("## 8. Phone menu");
    expect(md).toContain("## 9. Ask drawer");
    for (const w of ["सुबह का हिसाब", "Urja क्यों", "मेनू", "Urja से पूछें", "आपका सवाल", "Gemini से पूछ रहे हैं…", "बहरोड़ वाले हिस्से के सारे फ़्लैग दिखाएँ"]) expect(md).toContain(w);
    expect(md).toContain("212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · Gemini 3.5 Flash · 1.8 सेकंड में जवाब · Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें।");
  });

  it("lists the Ask answers: statuses, rules, cited-trip labels, the Check caveat and one fallback answer per prepared question (DES-22)", () => {
    expect(md).toContain("## 10. Ask answers");
    expect(md).toContain("| flag status · confirmed | आपने माना | confirmed | |");
    expect(md).not.toContain("पक्का किया");
    for (const r of ["R1", "R2", "R3", "R4", "R5"]) expect(md).toContain(`| rule · ${r} |`);
    expect(md).toContain("| ये ‘जाँचें’ वाले फ़्लैग हैं: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं। |");
    expect(md).toContain("| जयपुर → भिवंडी, 26 सितंबर: 39 लीटर · सामान्य से ज़्यादा डीज़ल | Jaipur → Bhiwandi, 26 Sep: 39 L · Excess consumption |");
    for (const w of ["driver with the most diesel", "last week's diesel", "least per km", "best per km", "flags on the Behror stretch", "yesterday's summary", "recovered this month", "how often Urja was wrong", "one truck's flags yesterday"])
      expect(md).toContain(`| answer · ${w}`);
    // DES-18: the rate-limited state's lines.
    expect(md).toContain("| अब आप फिर से पूछ सकते हैं। | You can ask again now. |");
    expect(md).toContain("| आज के सवालों की सीमा पूरी हो गई है। कल फिर पूछें। | That’s today’s limit of questions. Ask again tomorrow. |");
    expect(md).toContain("| 12 सेकंड बाद फिर से कोशिश करें | Try again in 12 s |");
    expect(md).toContain("| आपका सवाल सहेज लिया गया है। | Your question is saved. |");
  });
});

describe("Stage 9 · the Ask refusals are in the review", () => {
  it("lists both refusals beside their English", () => {
    const md = hindiReviewMarkdown();
    expect(md).toContain("| मेरे पास इसका डेटा नहीं है। मैं सिर्फ़ शर्मा रोडलाइंस के अपने ट्रिप, ट्रक, डीज़ल और पैसों का हिसाब जानता हूँ, उनके बारे में पूछें। | I don't have that data.");
    expect(md).toContain("| मैं यह नहीं बता सकता: अपने निर्देश या कोई key मैं किसी से साझा नहीं करता। अपने ट्रिप, ट्रक, डीज़ल या पैसों के बारे में पूछें। | I can't answer that:");
  });
});

