"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

/**
 * The per-minute limit's wait is under a minute; a daily cap's runs to midnight (lib/ask/rate-limit.ts).
 * Only the first is counted down; the second says to come back tomorrow, with no "Try again".
 */
const RETRY_COUNTDOWN_MAX_S = 60;

/** Seconds left of a 429's wait, ticking down once a second; 0 when there is none. A new state restarts it. */
function useCountdown(from: number | undefined, key: unknown): number {
  const [left, setLeft] = useState(from ?? 0);
  const [forKey, setForKey] = useState(key);
  if (key !== forKey) {
    setForKey(key);
    setLeft(from ?? 0);
  }
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return left;
}

/**
 * A ticking number for the eye; screen readers hear the server's wait once and then that it's over
 * (the conversation is aria-live, so a visible tick would be read out every second).
 */
function Ticking({ shown, spoken }: { shown: string; spoken: string }) {
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr">{spoken}</span>
    </>
  );
}

/**
 * 429 (DES-18): the wait is the heading, in place of a banner that blamed the AI, which wasn't asked.
 * It counts down with "Try again", then says the owner can ask again.
 */
function WaitHeading({ s, left, copy, lang }: { s: number; left: number; copy: AskCopy; lang: Lang }) {
  return (
    <h3 className="ask-banner" lang={lang}>
      {s > RETRY_COUNTDOWN_MAX_S ? copy.dailyLimit : left > 0 ? <Ticking shown={copy.retryAfter(left)} spoken={copy.retryAfter(s)} /> : copy.retryReady}
    </h3>
  );
}

/** "Try again", disabled with a countdown until a 429's wait has passed. */
function Retry({ onRetry, copy, left = 0 }: { onRetry: () => void; copy: AskCopy; left?: number }) {
  const waiting = left > 0;
  return (
    <div className="actions">
      <button type="button" className="btn btn-line" onClick={onRetry} disabled={waiting}>
        {waiting ? <Ticking shown={copy.retryIn(left)} spoken={copy.retry} /> : copy.retry}
      </button>
    </div>
  );
}

export function AskAnswer({ state, lang: ui = "en", scope, saved, onRetry, onCite }: AskAnswerProps) {
  const copy = ASK_COPY[ui];
  const wait = state.status === "answering" || state.status === "answer" ? undefined : state.retryAfterS;
  const daily = !!wait && wait > RETRY_COUNTDOWN_MAX_S;
  const left = useCountdown(daily ? undefined : wait, state);
  const retry = daily ? null : <Retry onRetry={onRetry} copy={copy} left={left} />;
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
          {wait ? (
            <WaitHeading s={wait} left={left} copy={copy} lang={ui} />
          ) : (
            <h3 className="ask-banner" lang={ui}>
              {copy.fallbackBanner}
            </h3>
          )}
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
              {wait ? ASK_COPY[savedLang].savedShort : saved[savedLang]}
            </p>
          </div>
          <Provenance r={r} scope={scope} lang={ui} />
          {retry}
        </>
      );
    }

    case "saved": {
      const r = state.response;
      const lang = answerLang(r);
      return (
        <>
          {question}
          {wait ? (
            <WaitHeading s={wait} left={left} copy={copy} lang={ui} />
          ) : (
            <h3 className="ask-banner" lang={ui}>
              {copy.savedBanner}
            </h3>
          )}
          <div className="fallback" lang={lang} data-mode="saved">
            {wait ? <p className="ans">{ASK_COPY[lang].savedShort}</p> : <Paragraphs text={r.answer} className="ans" />}
          </div>
          {retry}
        </>
      );
    }

    case "error":
      return (
        <>
          {question}
          {wait ? <WaitHeading s={wait} left={left} copy={copy} lang={ui} /> : null}
          <div className="fallback" lang={ui} data-mode="error">
            <p className="ans">{copy.error}</p>
          </div>
          {retry}
        </>
      );
  }
}
