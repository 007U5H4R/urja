"use client";

import type { FormEvent } from "react";
import type { BriefCopy } from "@/lib/brief/template";
import type { Lang } from "@/lib/data/types";
import { openAsk } from "@/lib/ask-events";

/**
 * The brief's Ask dock (final/brief.html `.dock`), as a slot: the mockup's
 * markup, and submitting opens Ask through openAsk(). TKT-12 wires the real
 * dock (the question, the answer) into this container.
 */
export function AskDockSlot({ lang, copy }: { lang: Lang; copy: BriefCopy["ask"] }) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    openAsk();
  };
  return (
    <div className="dock" lang={lang} data-slot="ask-dock">
      <form className="glass" onSubmit={submit}>
        <label htmlFor="ask-dock-q" className="sr">
          {copy.label}
        </label>
        <input id="ask-dock-q" name="q" autoComplete="off" placeholder={copy.placeholder} />
        <button type="submit" className="btn btn-lamp">
          {copy.button}
        </button>
      </form>
    </div>
  );
}
