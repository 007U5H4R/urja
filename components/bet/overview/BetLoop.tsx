import { ClaimList } from "@/components/bet/ClaimList";
import type { LOOP } from "@/content/bet/overview";
import { OvSection } from "./OvSection";

export interface BetLoopProps {
  loop: typeof LOOP;
  order: readonly string[];
}

/**
 * The bet as a loop (bet-spec §1–§2): five steps in a row, and a return path from the last back
 * to the first. Real text in an ordered list; the figure's caption is its accessible name.
 */
export function BetLoop({ loop, order }: BetLoopProps) {
  return (
    <OvSection id="loop">
      <figure className="ov-loop" aria-labelledby="ov-loop-cap">
        <figcaption id="ov-loop-cap" className="ov-loop-cap">{loop.caption}</figcaption>
        <ol className="ov-loop-steps">
          {loop.steps.map((s, i) => (
            <li key={s.title} className="ov-loop-step">
              <span className="ov-loop-n" aria-hidden="true">
                {i + 1}
              </span>
              <strong>{s.title}</strong>
              <span className="ov-loop-line">{s.line}</span>
            </li>
          ))}
        </ol>
        <p className="ov-loop-back">
          <span className="ov-loop-back-label">
            <span aria-hidden="true">↺ </span>
            {loop.back}
          </span>
        </p>
      </figure>
      <ClaimList claims={loop.claims} order={order} className="ov-small" deferBasis />
    </OvSection>
  );
}
