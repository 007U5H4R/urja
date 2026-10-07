"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FLAG_LAB_COPY as C } from "@/content/bet/flag-lab-copy";
import type { Tier } from "@/content/bet/ladder";
import type { FlagLabView } from "@/lib/bet/views/flag-lab";
import { ActionLadder } from "./ActionLadder";
import { StreamSteps } from "./StreamSteps";
import "./flag-lab.css";

const DEFAULT_TIER: Tier = "munshi";

/**
 * The flag lab on a flagged trip's evidence page (TASK-25): the panel's lens on the bet. More
 * independent streams give more confidence (<StreamSteps>), and more confidence plus a higher
 * tier gives more autonomy (<ActionLadder>).
 *
 * The page hands over the plain, JSON-safe view (getFlagLabView); every step × tier is already
 * computed there, so this holds only the chosen flag, step and tier. Prototype actions change
 * nothing and send nothing. `children` is the server-rendered footnote (the lab's cited claims, assumptions and Sources).
 */
export function FlagLab({ view, children }: { view: FlagLabView; children?: ReactNode }) {
  const [flagIx, setFlagIx] = useState(0);
  const flag = view.flags[flagIx];
  const [step, setStep] = useState(flag.defaultStep);
  const [tier, setTier] = useState<Tier>(DEFAULT_TIER);
  const [announce, setAnnounce] = useState("");
  const [note, setNote] = useState<{ level: string; text: string } | null>(null);

  const say = (ix: number, s: number, t: Tier) => {
    const f = view.flags[ix];
    const st = f.steps[s];
    const cells = f.matrix[s][t];
    const unlocked = view.levels.filter((_, k) => cells[k].unlocked);
    setAnnounce(
      C.announce({
        step: s + 1,
        total: f.steps.length,
        levelWord: st.levelWord,
        familiesText: st.familiesText,
        tier: view.tiers.find((x) => x.id === t)!.label,
        unlockedThrough: unlocked[unlocked.length - 1].id,
        available: cells.reduce((n, c) => n + c.actions.filter((a) => a.state === "available").length, 0),
      }),
    );
    setNote(null);
  };

  const pickFlag = (id: string) => {
    const ix = Math.max(0, view.flags.findIndex((f) => f.id === id));
    const s = view.flags[ix].defaultStep;
    setFlagIx(ix);
    setStep(s);
    say(ix, s, tier);
  };
  const pickStep = (s: number) => {
    setStep(s);
    say(flagIx, s, tier);
  };
  const pickTier = (t: Tier) => {
    setTier(t);
    say(flagIx, step, t);
  };

  return (
    <section className="panel flaglab" id={C.id} aria-labelledby="fl-h">
      <div className="sec-head fl-head">
        <h2 id="fl-h">{C.heading}</h2>
        <span className="chip wait">{C.tag}</span>
        {view.flags.length > 1 && (
          <span className="right fl-pick">
            <label htmlFor="fl-flag">{C.flagLabel}</label>
            <select id="fl-flag" value={flag.id} onChange={(e) => pickFlag(e.currentTarget.value)}>
              {view.flags.map((f) => (
                <option key={f.id} value={f.id}>
                  {`${f.ruleName} · ${f.confidenceWord} · ${f.inrText}`}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
      <p className="fl-intro">
        {C.intro.lead} <Link href={C.intro.href} prefetch={false}>
          {C.intro.link}
        </Link>
      </p>
      <div className="fl-grid">
        <StreamSteps flag={flag} step={step} onStep={pickStep} familiesNote={view.familiesNote} />
        <ActionLadder
          tiers={view.tiers}
          tier={tier}
          onTier={pickTier}
          levels={view.levels}
          cells={flag.matrix[step][tier]}
          note={note}
          onAction={(level, label) => setNote({ level, text: C.actionNote(label) })}
        />
      </div>
      {children}
      <p className="sr" aria-live="polite" data-testid="fl-announce">
        {announce}
      </p>
    </section>
  );
}
