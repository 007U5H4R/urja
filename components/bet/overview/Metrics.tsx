import { ClaimList } from "@/components/bet/ClaimList";
import type { Guardrail, METRICS_COPY, NORTH_STAR } from "@/content/bet/metrics";
import { OvSection } from "./OvSection";

export interface MetricsProps {
  northStar: typeof NORTH_STAR;
  primary: readonly string[];
  guardrails: readonly Guardrail[];
  copy: typeof METRICS_COPY;
  order: readonly string[];
}

/** bet-spec §9: the North Star and its definition, then the primary metrics and the guardrails. */
export function Metrics({ northStar, primary, guardrails, copy, order }: MetricsProps) {
  return (
    <OvSection id="metrics">
      <div className="ov-nsm">
        <p className="ov-kicker">{northStar.label}</p>
        <p className="ov-nsm-name">{northStar.name}</p>
        <p className="ov-nsm-why">{northStar.why}</p>
        <ClaimList claims={northStar.definition} order={order} className="ov-nsm-def" />
      </div>
      <div className="ov-metric-cols">
        <div>
          <h3>{copy.primaryHeading}</h3>
          <ul className="ov-metric-list">
            {primary.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{copy.guardrailHeading}</h3>
          <ul className="ov-metric-list ov-guardrails">
            {guardrails.map((g) => (
              <li key={g.name}>
                <span>{g.name}</span>
                <span className={g.threshold ? "ov-line" : "ov-line ov-line-none"}>{g.threshold ?? copy.noThreshold}</span>
              </li>
            ))}
          </ul>
          <ClaimList claims={[copy.claim]} order={order} className="ov-small" />
        </div>
      </div>
    </OvSection>
  );
}
