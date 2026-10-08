import { ClaimList } from "@/components/bet/ClaimList";
import type { Guardrail, METRICS_COPY, NORTH_STAR, PrimaryMetric, Target } from "@/content/bet/metrics";
import { OvSection } from "./OvSection";

export interface MetricsProps {
  northStar: typeof NORTH_STAR;
  primary: readonly PrimaryMetric[];
  guardrails: readonly Guardrail[];
  copy: typeof METRICS_COPY;
  order: readonly string[];
}

/** An EXE47 target: the line, then the Assumption tag and its basis. */
function TargetLine({ target }: { target: Target }) {
  return (
    <span className="ov-target">
      <span className="ov-line">{target.text}</span>{" "}
      <span className="bet-assume">
        <span className="bet-assume-tag">Assumption</span> {target.basis}
      </span>
    </span>
  );
}

/** bet-spec §9: the North Star and its definition, then the primary metrics and the guardrails. */
export function Metrics({ northStar, primary, guardrails, copy, order }: MetricsProps) {
  return (
    <OvSection id="metrics">
      <div className="ov-nsm">
        <p className="ov-kicker">{northStar.label}</p>
        <p className="ov-nsm-name">{northStar.name}</p>
        <p className="ov-nsm-why">{northStar.why}</p>
        <ClaimList claims={northStar.definition} order={order} className="ov-nsm-def" deferBasis />
      </div>
      <div className="ov-metric-cols">
        <div>
          <h3>{copy.primaryHeading}</h3>
          <ul className="ov-metric-list">
            {primary.map((m) => (
              <li key={m.name}>
                <span>{m.name}</span>
                {m.target && <TargetLine target={m.target} />}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{copy.guardrailHeading}</h3>
          <ul className="ov-metric-list ov-guardrails">
            {guardrails.map((g) => (
              <li key={g.name}>
                <span>{g.name}</span>
                {g.threshold ? (
                  <span className="ov-line">{g.threshold}</span>
                ) : g.target ? (
                  <TargetLine target={g.target} />
                ) : (
                  <span className="ov-line ov-line-none">{copy.noThreshold}</span>
                )}
              </li>
            ))}
          </ul>
          <ClaimList claims={[copy.claim]} order={order} className="ov-small" deferBasis />
        </div>
      </div>
    </OvSection>
  );
}
