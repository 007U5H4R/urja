"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Bilingual } from "@/lib/data/types";
import { AskAnswer } from "./AskAnswer";
import { ASK_CHIPS, ASK_COPY } from "./copy";
import { usePageLang } from "./usePageLang";
import { ASK_MAX_CHARS, type UseAsk } from "./useAsk";
import "./ask.css";

/**
 * The Ask drawer (final/index.html lines 158–181), on a Radix Dialog (EXE2:
 * the shadcn registry is blocked, so this is the Sheet written directly):
 * right edge, 240 ms in and out, a 180 ms scrim, focus trapped, Esc closes.
 * At ≤760px lamp.css's `width: min(460px, 100vw)` makes it the full-height
 * phone chat view. While it is open everything else in <body> is `inert`.
 * Its labels follow the screen's language (<html lang>, EXE23): Hindi on the
 * Hindi brief and message, English everywhere else.
 */
export interface AskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ask: UseAsk;
  /** The provenance scope, computed on the server, in both languages. */
  scope: Bilingual;
  saved: { hi: string; en: string };
  /** Where focus goes when the sheet closes (the trigger that opened it). */
  returnFocus: () => HTMLElement | null;
}

/** Makes every other child of <body> inert while `active` (Design.md §17, TC-026). */
function InertOutside({ active, within }: { active: boolean; within: React.RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const self = within.current;
    if (!active || !self) return;
    const touched: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      // The scrim is a sibling portal; it stays live so a click on it closes the sheet.
      if (el.contains(self) || el.classList.contains("scrim") || el.hasAttribute("inert")) continue;
      el.setAttribute("inert", "");
      touched.push(el);
    }
    return () => touched.forEach((el) => el.removeAttribute("inert"));
  }, [active, within]);
  return null;
}

export function AskSheet({ open, onOpenChange, ask, scope, saved, returnFocus }: AskSheetProps) {
  const { state } = ask;
  const lang = usePageLang();
  const copy = ASK_COPY[lang];
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const [value, setValue] = useState("");

  // An answer clears the box; fallback, saved and error keep the question there for "Try again".
  const kept = state.status === "idle" || state.status === "answering" ? null : state.status === "answer" ? "" : state.question;
  const [lastKept, setLastKept] = useState<string | null>(null);
  if (kept !== lastKept) {
    setLastKept(kept);
    if (kept !== null) setValue(kept);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask.ask(value);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim" data-testid="ask-scrim" />
        <Dialog.Content
          asChild
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus()?.focus();
          }}
        >
          <aside className="drawer" id="ask-drawer" role="dialog" aria-modal="true" lang={lang} ref={contentRef}>
            <InertOutside active={open} within={contentRef} />
            <header>
              <span className="mark">
                <svg viewBox="0 0 26 26" aria-hidden="true">
                  <use href="#i-mark" />
                </svg>
              </span>
              <Dialog.Title asChild>
                <h2>{copy.title}</h2>
              </Dialog.Title>
              <Dialog.Close className="iconbtn" aria-label={copy.close}>
                <Icon name="x" />
              </Dialog.Close>
            </header>
            <div className="body">
              <div className="convo" aria-live="polite">
                {state.status !== "idle" && (
                  <AskAnswer state={state} lang={lang} scope={scope} saved={saved} onRetry={ask.retry} onCite={() => onOpenChange(false)} />
                )}
              </div>
              <div className="sugg" role="group" aria-label={copy.suggestedLabel}>
                {ASK_CHIPS[lang].map((c) => (
                  <button
                    key={c.text}
                    type="button"
                    className={c.lang === "hi" ? "hi" : undefined}
                    lang={c.lang}
                    onClick={() => ask.ask(c.text)}
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            </div>
            <form className="composer" onSubmit={submit}>
              <label className="sr" htmlFor="askIn">
                {copy.inputLabel}
              </label>
              <input
                id="askIn"
                ref={inputRef}
                name="q"
                autoComplete="off"
                maxLength={ASK_MAX_CHARS}
                placeholder={copy.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <button type="submit" className="btn btn-lamp">
                {copy.submit}
              </button>
            </form>
          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
