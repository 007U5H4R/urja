export type ConfidenceLevel = "high" | "likely" | "check";
export type Lang = "en" | "hi";

/** technical-plan §1: High / Likely / Check = पक्का / शायद / जाँचें; three bars lit from the left. */
export const CONFIDENCE: Record<ConfidenceLevel, { bars: 1 | 2 | 3; en: string; hi: string }> = {
  high: { bars: 3, en: "High", hi: "पक्का" },
  likely: { bars: 2, en: "Likely", hi: "शायद" },
  check: { bars: 1, en: "Check", hi: "जाँचें" },
};

/**
 * Confidence meter: shape + word, never colour alone (lamp.css `.conf`).
 * `<span class="conf" data-level="3"><i><b></b><b></b><b></b></i>High</span>`.
 * `suffix` extends the word, e.g. the trip flag card's “High confidence”.
 */
export function Confidence({ level, lang, suffix }: { level: ConfidenceLevel; lang: Lang; suffix?: string }) {
  const c = CONFIDENCE[level];
  const word = `${c[lang]}${suffix ?? ""}`;
  return (
    <span className="conf" data-level={c.bars}>
      <i>
        <b></b>
        <b></b>
        <b></b>
      </i>
      {lang === "hi" ? <span lang="hi">{word}</span> : word}
    </span>
  );
}
