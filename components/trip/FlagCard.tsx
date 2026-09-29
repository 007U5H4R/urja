import { Confidence } from "@/components/ui/Confidence";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { StatusChip } from "@/components/ui/StatusChip";
import type { DriverView, EvidenceLine, TripCard } from "@/lib/data/views/trip";
import { DriverSide } from "./DriverSide";

function Evidence({ label, lines }: { label: string; lines: EvidenceLine[] }) {
  return (
    <>
      <p className="label" id="flag-ev">
        {label}
      </p>
      <EvidenceList lines={lines} />
    </>
  );
}

function EvidenceList({ lines }: { lines: EvidenceLine[] }) {
  return (
    <ul className="evidence" aria-labelledby="flag-ev">
      {lines.map((e) => (
        <li key={e.text}>
          <Icon name={e.icon} />
          <span>{e.text}</span>
          <span className="src">{e.source}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * final/trip.html lines 47–77: the verdict card. One variant per rule
 * (technical-plan §5.4), "Every check passed" on a clean trip, and an honest
 * "still on the road" card for a trip that hasn't arrived.
 */
export function FlagCard({ card, driver }: { card: TripCard; driver: DriverView }) {
  if (card.kind === "flag") {
    const f = card.flag;
    const amt = f.status === "waiting" ? { lit: "loss" as const } : f.status === "confirmed" ? { tone: "loss" as const } : {};
    return (
      <article className="panel flagcard" aria-labelledby="flag-h" data-rule={f.rule}>
        <div>
          <div className="rule">
            <StatusChip tone="warn">{f.ruleName}</StatusChip>
            <Confidence level={f.confidence} lang="en" suffix={f.confidenceSuffix} />
          </div>
          <h2 id="flag-h">{f.title}</h2>
          <p className="amt">
            <Money inr={f.inr} sign="never" {...amt} />
            <span className="muted">{f.amtNote}</span>
          </p>
        </div>
        <div className="block">
          <Evidence label="What the truck recorded" lines={f.evidence} />
          <p className="why">
            <b>{f.why.label}</b> {f.why.text}
          </p>
        </div>
        <DriverSide driver={driver} side={f.driverSide} />
      </article>
    );
  }
  if (card.kind === "clean") {
    return (
      <article className="panel flagcard" aria-labelledby="flag-h" data-rule="clean">
        <div>
          <div className="rule">
            <StatusChip tone="ok">{card.chip}</StatusChip>
          </div>
          <h2 id="flag-h">{card.title}</h2>
        </div>
        <div className="block">
          <Evidence label={card.label} lines={card.checks} />
        </div>
        <DriverSide driver={driver} side={null} />
      </article>
    );
  }
  return (
    <article className="panel flagcard" aria-labelledby="flag-h" data-rule="live">
      <div>
        <div className="rule">
          <StatusChip tone="moving">{card.chip}</StatusChip>
        </div>
        <h2 id="flag-h">{card.title}</h2>
      </div>
      <div className="block">
        <p className="why">{card.text}</p>
      </div>
      <DriverSide driver={driver} side={null} />
    </article>
  );
}
