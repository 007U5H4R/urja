import { SimulatedTag } from "@/components/bet/SimulatedTag";
import type { AUTONOMY } from "@/content/bet/overview";
import { OvSection } from "./OvSection";

export interface AutonomyProps {
  autonomy: typeof AUTONOMY;
}

/**
 * bet-spec §6–§7 in one view: each stream rules out an innocent cause (three real flags show it),
 * and confidence on a higher tier unlocks L1–L5; L4 also needs independent families (EXE45). The link opens the flag lab on a real trip.
 */
export function Autonomy({ autonomy: a }: AutonomyProps) {
  return (
    <OvSection id="autonomy" className="ov-autonomy">
      <div className="ov-auto-grid">
        <div className="ov-auto-col">
          <h3>{a.confidenceHeading}</h3>
          <p className="ov-auto-lede">{a.confidenceLede}</p>
          <ul className="ov-showcases" aria-label={a.showcasesLabel}>
            {a.showcases.map((s) => (
              <li key={s.tripId} className="ov-showcase">
                <span className="ov-trip">
                  {a.tripLabel} {s.tripId}
                </span>
                <span className="ov-path">
                  {s.path.map((lv, i) => (
                    <span key={lv} className="ov-path-step">
                      {i > 0 && (
                        <span className="ov-path-arrow" aria-hidden="true">
                          →
                        </span>
                      )}
                      {i > 0 && <span className="sr">{a.thenLabel}</span>}
                      <span className={`ov-level ov-level-${lv}`}>{a.levelWord[lv]}</span>
                    </span>
                  ))}
                </span>
                <span className="ov-showcase-note">
                  {s.note}
                  {s.simulated && <SimulatedTag>{`${s.simulated}: simulated`}</SimulatedTag>}
                </span>
              </li>
            ))}
          </ul>
          <p className="ov-families">{a.familiesNote}</p>
        </div>
        <div className="ov-auto-col">
          <h3>{a.ladderHeading}</h3>
          <ol className="ov-ladder">
            {a.ladder.map((l) => (
              <li key={l.id} className={`ov-rung ov-rung-${l.id.toLowerCase()}`}>
                <span className="ov-rung-id">{l.id}</span>
                <span className="ov-rung-body">
                  <span className="ov-rung-name">
                    {l.name} <span className="ov-rung-tier">{l.tier}</span>
                  </span>
                  <span className="ov-rung-summary">{l.summary}</span>
                  <span className="ov-rung-gate">
                    <span className="ov-rung-gate-label">{a.gateLabel}</span> {l.gate}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="ov-cta">
        <a className="btn btn-lamp" href={a.link.href}>
          {a.link.label}
          <span aria-hidden="true"> →</span>
        </a>
        <span className="ov-cta-line">{a.link.line}</span>
      </div>
    </OvSection>
  );
}
