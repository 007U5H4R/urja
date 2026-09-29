"use client";

import type { Lang } from "@/lib/data/types";

/** The language toggle (final/brief.html `.lang`): हिं / EN, pressed state on the current one. */
export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="lang" role="group" aria-label="Language / भाषा">
      <button type="button" aria-pressed={lang === "hi"} lang="hi" onClick={() => onChange("hi")}>
        हिं
      </button>
      <button type="button" aria-pressed={lang === "en"} lang="en" onClick={() => onChange("en")}>
        EN
      </button>
    </div>
  );
}
