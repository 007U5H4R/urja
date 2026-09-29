"use client";

import Link from "next/link";
import type { AskCite, AskResponse } from "@/lib/ask/contract";
import type { Bilingual, Lang } from "@/lib/data/types";
import { ASK_COPY, type AskCopy } from "./copy";
import { provenanceLine, textLang } from "./format";
import type { AskState } from "./useAsk";

/**
 * The conversation inside the drawer for every non-idle state (§6.6):
 * answering, answer (final/index.html `.a`), fallback and saved
 * (final/states.html `.fallback`), and error. Model text is only ever a
 * React text node, never HTML (Review focus #2). Its own labels are in the
 * screen's language (`lang`, EXE23); an answer keeps the language it came in.
 */
export interface AskAnswerProps {
  state: Exclude<AskState, { status: "idle" }>;
  /** The screen's language: the drawer's own labels follow it (EXE23). */
  lang?: Lang;
  /** Server-computed scope, in both languages; English is used only when a response carries none. */
  scope: Bilingual;
  saved: { hi: string; en: string };
  onRetry: () => void;
  /** A cite chip was followed (the sheet closes). */
  onCite?: () => void;
}

const answerLang = (r: AskResponse) => (r.lang === "hi" ? "hi" : "en");

/** Plain text → paragraphs of text nodes. */
function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

function CiteChip({ cite, lang, onCite }: { cite: AskCite; lang: Lang; onCite?: () => void }) {
  return (
    <Link className="cite" lang={lang} href={`/trips/${encodeURIComponent(cite.tripId)}`} prefetch={false} onClick={onCite}>
      {ASK_COPY[lang].citeChip(cite.tripId)}
    </Link>
  );
}

/** The response's scope is English; on a Hindi screen the server-computed Hindi scope (the same numbers) is shown. */
function Provenance({ r, scope, lang }: { r: AskResponse; scope: Bilingual; lang: Lang }) {
  const s = lang === "hi" ? scope.hi : r.provenance.scope || scope.en;
  return (
    <p className="prov" lang={lang}>
      {provenanceLine({ scope: s, model: r.provenance.model, ms: r.provenance.ms }, lang)}
    </p>
  );
}

function RetryAfter({ s, copy, lang }: { s?: number; copy: AskCopy; lang: Lang }) {
  return s ? (
    <p className="saved" lang={lang}>
      {copy.retryAfter(s)}
    </p>
  ) : null;
}

function Retry({ onRetry, copy }: { onRetry: () => void; copy: AskCopy }) {
  return (
    <div className="actions">
      <button type="button" className="btn btn-line" onClick={onRetry}>
        {copy.retry}
      </button>
    </div>
  );
}

export function AskAnswer({ state, lang: ui = "en", scope, saved, onRetry, onCite }: AskAnswerProps) {
  const copy = ASK_COPY[ui];
  const question = (
    <div className={textLang(state.question) === "hi" ? "q hi" : "q"} lang={textLang(state.question)}>
      {state.question}
    </div>
  );

  switch (state.status) {
    case "answering":
      return (
        <>
          {question}
          <p className="asking" lang={ui}>
            {copy.answering}
          </p>
        </>
      );

    case "answer": {
      const r = state.response;
      return (
        <>
          {question}
          <div className="a" lang={answerLang(r)} data-mode="model">
            <Paragraphs text={r.answer} />
            {r.cites.length > 0 && (
              <ol aria-label={copy.citesLabel}>
                {r.cites.map((c) => (
                  <li key={c.tripId}>
                    {c.label}
                    <CiteChip cite={c} lang={ui} onCite={onCite} />
                  </li>
                ))}
              </ol>
            )}
            {r.caveat && <p className="muted">{r.caveat}</p>}
            <Provenance r={r} scope={scope} lang={ui} />
          </div>
        </>
      );
    }

    case "fallback": {
      const r = state.response;
      const lang = answerLang(r);
      // "Your question is saved" is Hindi when the screen or the answer is.
      const savedLang = ui === "hi" || lang === "hi" ? "hi" : "en";
      return (
        <>
          {question}
          <h3 className="ask-banner" lang={ui}>
            {copy.fallbackBanner}
          </h3>
          <div className="fallback" lang={lang} data-mode="fallback">
            <Paragraphs text={r.answer} className="ans" />
            {r.cites.length > 0 && (
              <p className="cites" aria-label={copy.citesLabel}>
                {r.cites.map((c) => (
                  <CiteChip key={c.tripId} cite={c} lang={ui} onCite={onCite} />
                ))}
              </p>
            )}
            {r.caveat && <p className="muted">{r.caveat}</p>}
            <p className="saved" lang={savedLang}>
              {saved[savedLang]}
            </p>
            <RetryAfter s={state.retryAfterS} copy={copy} lang={ui} />
          </div>
          <Provenance r={r} scope={scope} lang={ui} />
          <Retry onRetry={onRetry} copy={copy} />
        </>
      );
    }

    case "saved": {
      const r = state.response;
      return (
        <>
          {question}
          <h3 className="ask-banner" lang={ui}>
            {copy.savedBanner}
          </h3>
          <div className="fallback" lang={answerLang(r)} data-mode="saved">
            <Paragraphs text={r.answer} className="ans" />
            <RetryAfter s={state.retryAfterS} copy={copy} lang={ui} />
          </div>
          <Retry onRetry={onRetry} copy={copy} />
        </>
      );
    }

    case "error":
      return (
        <>
          {question}
          <div className="fallback" lang={ui} data-mode="error">
            <p className="ans">{copy.error}</p>
            <RetryAfter s={state.retryAfterS} copy={copy} lang={ui} />
          </div>
          <Retry onRetry={onRetry} copy={copy} />
        </>
      );
  }
}
