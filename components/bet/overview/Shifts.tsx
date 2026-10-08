import { ClaimList } from "@/components/bet/ClaimList";
import type { HYPE_COPY, TrendItem } from "@/content/bet/hype";
import { InlineClaim } from "./InlineClaim";
import { OvSection } from "./OvSection";

export interface ShiftsProps {
  structural: readonly TrendItem[];
  hype: readonly TrendItem[];
  copy: typeof HYPE_COPY;
  order: readonly string[];
}

function Column({ kind, heading, lede, label, items, order }: {
  kind: "structural" | "hype";
  heading: string;
  lede: string;
  label: string;
  items: readonly TrendItem[];
  order: readonly string[];
}) {
  return (
    <div className={`ov-shift ov-shift-${kind}`}>
      <h3>{heading}</h3>
      <p className="ov-shift-lede">{lede}</p>
      <ul className="ov-shift-list">
        {items.map((it) => (
          <li key={it.id} className="ov-shift-item">
            <h4>{it.name}</h4>
            <p className="ov-mech">
              <span className="ov-mech-label">{label}</span> <InlineClaim claim={it.mechanism} order={order} deferBasis />
            </p>
            <ClaimList claims={it.evidence} order={order} className="ov-small" deferBasis />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Structural shifts (with their mechanism) beside the hype (with its mechanism of failure). */
export function Shifts({ structural, hype, copy, order }: ShiftsProps) {
  return (
    <OvSection id="shifts">
      <div className="ov-shifts">
        <Column kind="structural" heading={copy.structuralHeading} lede={copy.structuralLede} label={copy.mechanismLabel} items={structural} order={order} />
        <Column kind="hype" heading={copy.hypeHeading} lede={copy.hypeLede} label={copy.failureLabel} items={hype} order={order} />
      </div>
    </OvSection>
  );
}
