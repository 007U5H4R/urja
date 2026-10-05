"use client";

import { useState, type FormEvent } from "react";
import { openAsk } from "@/lib/ask-events";
import { useAskOpener } from "./AskProvider";

/**
 * The brief's Ask dock (final/brief.html `.dock`, TSK-12.3). Submitting sends
 * the question to the same `useAsk` as the drawer and opens the drawer, which
 * at phone width is the full-height chat view. An empty submit just opens it.
 * Outside an AskProvider (unit tests of the brief) it falls back to openAsk().
 */
export interface AskDockProps {
  lang: "hi" | "en";
  copy: { label: string; placeholder: string; button: string };
}

export function AskDock({ lang, copy }: AskDockProps) {
  const open = useAskOpener();
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const question = value.trim();
    if (open) {
      open(question || undefined, lang);
      if (question) setValue("");
    } else {
      openAsk();
    }
  };

  return (
    <div className="dock" lang={lang} data-slot="ask-dock">
      {/* A search landmark, so the dock isn't content outside every landmark (axe `region`, DES-25). */}
      <form className="glass" role="search" aria-label={copy.label} onSubmit={submit}>
        <label htmlFor="ask-dock-q" className="sr">
          {copy.label}
        </label>
        <input
          id="ask-dock-q"
          name="q"
          autoComplete="off"
          maxLength={500}
          placeholder={copy.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="btn btn-lamp">
          {copy.button}
        </button>
      </form>
    </div>
  );
}
