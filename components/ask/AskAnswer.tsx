"use client";

import Link from "next/link";
import type { AskCite, AskResponse } from "@/lib/ask/contract";
import { ASK_COPY } from "./copy";
import { provenanceLine, textLang } from "./format";
import type { AskState } from "./useAsk";

/**
 * The conversation inside the drawer for every non-idle state (§6.6):
 * answering, answer (final/index.html `.a`), fallback and saved
 * (final/states.html `.fallback`), and error. Model text is only ever a
 * React text node, never HTML (Review focus #2).
 */
export interface AskAnswerProps {
  state: Exclude<AskState, { status: "idle" }>;
  /** Server-computed scope, used when a response carries none. */
  scope: string;
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

function CiteChip({ cite, onCite }: { cite: AskCite; onCite?: () => void }) {
  return (
    <Link className="cite" href={`/trips/${encodeURIComponent(cite.tripId)}`} prefetch={false} onClick={onCite}>
      {ASK_COPY.citeChip(cite.tripId)}
    </Link>
  );
}

function Provenance({ r, scope }: { r: AskResponse; scope: string }) {
  return (
    <p className="prov" lang="en">
      {provenanceLine({ scope: r.provenance.scope || scope, model: r.provenance.model, ms: r.provenance.ms })}
    </p>
  );
}

function RetryAfter({ s }: { s?: number }) {
  return s ? <p className="saved">{ASK_COPY.retryAfter(s)}</p> : null;
}

function Retry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="actions">
      <button type="button" className="btn btn-line" onClick={onRetry}>
        {ASK_COPY.retry}
      </button>
    </div>
  );
}

export function AskAnswer({ state, scope, saved, onRetry, onCite }: AskAnswerProps) {
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
          <p className="asking">
            {ASK_COPY.answering}
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
              <ol aria-label={ASK_COPY.citesLabel}>
                {r.cites.map((c) => (
                  <li key={c.tripId}>
                    {c.label}
                    <CiteChip cite={c} onCite={onCite} />
                  </li>
                ))}
              </ol>
            )}
            {r.caveat && <p className="muted">{r.caveat}</p>}
            <Provenance r={r} scope={scope} />
          </div>
        </>
      );
    }

    case "fallback": {
      const r = state.response;
      const lang = answerLang(r);
      return (
        <>
          {question}
          <h3 className="ask-banner" lang="en">
            {ASK_COPY.fallbackBanner}
          </h3>
          <div className="fallback" lang={lang} data-mode="fallback">
            <Paragraphs text={r.answer} className="ans" />
            {r.cites.length > 0 && (
              <p className="cites" aria-label={ASK_COPY.citesLabel}>
                {r.cites.map((c) => (
                  <CiteChip key={c.tripId} cite={c} onCite={onCite} />
                ))}
              </p>
            )}
            {r.caveat && <p className="muted">{r.caveat}</p>}
            <p className="saved">{saved[lang]}</p>
            <RetryAfter s={state.retryAfterS} />
          </div>
          <Provenance r={r} scope={scope} />
          <Retry onRetry={onRetry} />
        </>
      );
    }

    case "saved": {
      const r = state.response;
      return (
        <>
          {question}
          <h3 className="ask-banner" lang="en">
            {ASK_COPY.savedBanner}
          </h3>
          <div className="fallback" lang={answerLang(r)} data-mode="saved">
            <Paragraphs text={r.answer} className="ans" />
            <RetryAfter s={state.retryAfterS} />
          </div>
          <Retry onRetry={onRetry} />
        </>
      );
    }

    case "error":
      return (
        <>
          {question}
          <div className="fallback" lang="en" data-mode="error">
            <p className="ans">{ASK_COPY.error}</p>
            <RetryAfter s={state.retryAfterS} />
          </div>
          <Retry onRetry={onRetry} />
        </>
      );
  }
}
