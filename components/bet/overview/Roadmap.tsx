import { ClaimList } from "@/components/bet/ClaimList";
import type { ROADMAP_COPY, RoadmapPhase } from "@/content/bet/roadmap";
import { OvSection } from "./OvSection";

export interface RoadmapProps {
  phases: readonly RoadmapPhase[];
  notBuilding: readonly string[];
  copy: typeof ROADMAP_COPY;
  order: readonly string[];
}

/** bet-spec §10: three phases side by side, then what we are not building. */
export function Roadmap({ phases, notBuilding, copy, order }: RoadmapProps) {
  return (
    <OvSection id="roadmap">
      <ol className="ov-phases">
        {phases.map((p) => (
          <li key={p.id} className={`ov-phase ov-${p.id}`}>
            <h3>
              {p.name} <span className="ov-phase-window">{p.window}</span>
            </h3>
            <ul>
              {p.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="ov-not">
        <h3>{copy.notBuildingHeading}</h3>
        <ul className="ov-not-list">
          {notBuilding.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
      <ClaimList claims={[copy.claim, copy.funding]} order={order} className="ov-small" deferBasis />
    </OvSection>
  );
}
