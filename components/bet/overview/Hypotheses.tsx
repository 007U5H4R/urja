import { ClaimList } from "@/components/bet/ClaimList";
import type { HYPOTHESES_COPY, Hypothesis } from "@/content/bet/hypotheses";
import { OvSection } from "./OvSection";

export interface HypothesesProps {
  hypotheses: readonly Hypothesis[];
  copy: typeof HYPOTHESES_COPY;
  order: readonly string[];
}

/**
 * H1–H7 (bet-spec §5), one <details> each: the row shows the hypothesis, a short verdict and
 * "Untested: no field calls"; opened, the full verdict and the research for and against.
 */
export function Hypotheses({ hypotheses, copy, order }: HypothesesProps) {
  return (
    <OvSection id="hypotheses" lede={copy.lede}>
      <ul className="ov-hyps">
        {hypotheses.map((h) => (
          <li key={h.id}>
            <details className="ov-hyp">
              <summary>
                <span className="ov-hyp-id">{h.id}</span>
                <span className="ov-hyp-statement">{h.statement}</span>
                <span className="ov-hyp-tags">
                  <span className="ov-hyp-verdict">{h.verdictShort}</span>
                  <span className="chip wait ov-hyp-status">{h.status}</span>
                </span>
              </summary>
              <div className="ov-hyp-body">
                <p className="ov-hyp-full">
                  <span className="ov-mech-label">{copy.verdictLabel}</span> {h.verdict}
                </p>
                {h.noEvidence ? (
                  <ClaimList claims={[h.noEvidence]} order={order} className="ov-small" />
                ) : (
                  <div className="ov-hyp-cols">
                    <div>
                      <h3>{copy.forLabel}</h3>
                      <ClaimList claims={h.for} order={order} className="ov-small" />
                    </div>
                    <div>
                      <h3>{copy.againstLabel}</h3>
                      <ClaimList claims={h.against} order={order} className="ov-small" />
                    </div>
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </OvSection>
  );
}
