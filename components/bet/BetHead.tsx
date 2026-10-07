import type { ReactNode } from "react";
import { PROTOTYPE_DETAIL, PROTOTYPE_NOTE } from "@/content/bet/copy";
import { SimulatedTag } from "./SimulatedTag";

export interface BetHeadProps {
  eyebrow: ReactNode;
  h1: ReactNode;
  /** The product line or the page's thesis. */
  thesis: string;
}

/** The page head every bet page shares (lamp.css `.pagehead`): eyebrow, h1, thesis, and the prototype note. */
export function BetHead({ eyebrow, h1, thesis }: BetHeadProps) {
  return (
    <section className="pagehead bet-head" aria-labelledby="h1">
      <div>
        <p className="greet">{eyebrow}</p>
        <h1 className="verdict" id="h1">
          {h1}
        </h1>
        <p className="bet-thesis">{thesis}</p>
        <p className="bet-note">
          <SimulatedTag>{PROTOTYPE_NOTE}</SimulatedTag>
          <span>{PROTOTYPE_DETAIL}</span>
        </p>
      </div>
    </section>
  );
}
