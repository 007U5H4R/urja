"use client";

import Link from "next/link";
import { useState } from "react";

import { Confidence } from "@/components/ui/Confidence";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";
import { SectionHead } from "@/components/ui/SectionHead";
import { StatusChip } from "@/components/ui/StatusChip";
import type { CleanLine, EyeRow, EyesHead } from "@/lib/data/views/today";

export interface EyesListProps {
  eyes: EyeRow[];
  head: EyesHead;
  cleanLine: CleanLine;
  /** The lit row when the HeroCard drives the selection; uncontrolled otherwise, starting at row 1. */
  selected?: EyeRow["n"];
  /** Fired when a row is selected; the HeroCard lights it, updates the glass card and rail, and flies the map. */
  onSelect?: (n: EyeRow["n"]) => void;
}

/**
 * "Needs your eyes" (final/index.html lines 75–102): yesterday's flags in eye
 * order. The whole row is a toggle button that lights it and shows it in the
 * hero (glass card, rail, map); "Evidence" opens the trip.
 */
export function EyesList({ eyes, head, cleanLine, selected, onSelect }: EyesListProps) {
  const [own, setOwn] = useState<EyeRow["n"]>(eyes[0]?.n ?? 1);
  const current = selected ?? own;
  const select = (n: EyeRow["n"]) => {
    if (selected === undefined) setOwn(n);
    onSelect?.(n);
  };

  return (
    <article className="panel eyes" aria-labelledby="eyes-h">
      <SectionHead
        id="eyes-h"
        title="Needs your eyes"
        count={head.countText}
        right={<Money className="delta" tone="loss" inr={head.inr} />}
      />
      {eyes.map((e) => {
        const on = e.n === current;
        return (
          <div key={e.n} className={on ? "eye on" : "eye"}>
            <button type="button" className="eye-sel" aria-pressed={on} aria-label={e.selectLabel} onClick={() => select(e.n)} />
            <span className="n">{e.n}</span>
            <span className="l1">
              <Plate plate={e.plate} />
              <span className="who">
                {e.driver} · {e.route}
              </span>
            </span>
            <Money className="amt" tone="loss" inr={e.inr} />
            <span className="what">{e.what}</span>
            <span className="l3">
              <Confidence level={e.confidence} lang="en" />
              <StatusChip tone={e.driverStatus.tone === "wait" ? "wait" : undefined}>{e.driverStatus.text}</StatusChip>
              <Link
                className="open"
                href={`/trips/${e.tripId}`}
                aria-label={`Evidence for ${e.plate}, trip ${e.tripId}`}
              >
                Evidence
                <Icon name="right" />
              </Link>
            </span>
          </div>
        );
      })}
      {cleanLine.text != null && (
        <p className="clean">
          <Icon name="check" />
          {/* EXE8 wording, built in the view model. */}
          <span>{cleanLine.text}</span>
        </p>
      )}
    </article>
  );
}
