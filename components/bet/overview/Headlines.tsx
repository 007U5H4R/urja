import { Cite } from "@/components/bet/Cite";
import type { Headline } from "@/content/bet/overview";
import { isCited } from "@/content/bet/sources";
import { OvSection } from "./OvSection";

export interface HeadlinesProps {
  headlines: readonly Headline[];
  order: readonly string[];
}

/**
 * TASK-32: the bet in three numbers, each a figure its claim states (content/bet/overview.ts), with
 * the claim's [n] or its Assumption tag; the basis waits in the page's <Assumptions> list.
 */
export function Headlines({ headlines, order }: HeadlinesProps) {
  return (
    <OvSection id="headlines">
      <ul className="ov-heads">
        {headlines.map((h) => (
          <li key={h.value} className="ov-head">
            <span className="ov-head-value">{h.value}</span>
            <span className="ov-head-label">
              {h.label}{" "}
              {isCited(h.claim) ? (
                <Cite ids={h.claim.sourceIds} order={order} />
              ) : (
                <span className="bet-assume">
                  <span className="bet-assume-tag">Assumption</span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </OvSection>
  );
}
