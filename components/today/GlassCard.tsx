import Link from "next/link";
import type { CSSProperties } from "react";

import { Confidence } from "@/components/ui/Confidence";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";
import type { HeroFlag, HeroFleet } from "@/lib/data/views/today";

export type GlassContent = { kind: "flag"; flag: HeroFlag } | { kind: "fleet"; fleet: HeroFleet };

/** final/index.html showFleet(): the legend dots, verbatim. */
const DOT: Record<HeroFleet["legend"][number]["state"], CSSProperties> = {
  moving: { width: 8, height: 8, borderRadius: "50%", background: "var(--cream)", boxShadow: "0 0 8px var(--glow)" },
  yard: { width: 8, height: 8, borderRadius: "50%", background: "var(--fg-subtle)" },
  workshop: { width: 8, height: 8, borderRadius: "50%", boxShadow: "inset 0 0 0 1.5px var(--fg-muted)" },
};

const SMALL: CSSProperties = { fontSize: 12 };

/**
 * The glass card over the hero (final/index.html `#fc`, showFlag / showFleet):
 * the selected flag's plate, trip, rows and amount with "Open the evidence",
 * or the fleet's counts. `aria-live` announces a new selection.
 */
export function GlassCard({ content }: { content: GlassContent }) {
  if (content.kind === "fleet") {
    const f = content.fleet;
    return (
      <div className="glass floatcard" id="fc" aria-live="polite">
        <div className="fc-head">
          <b>{f.title}</b>
          <span className="subtle" style={SMALL}>
            {f.updated}
          </span>
        </div>
        <dl>
          {f.legend.map((l) => (
            <div key={l.state}>
              <dt>
                <i style={DOT[l.state]}></i>
                {l.label}
              </dt>
              <dd>{l.count}</dd>
            </div>
          ))}
        </dl>
        <a className="btn btn-line" href={f.cta.href}>
          {f.cta.text}
          <Icon name="right" />
        </a>
      </div>
    );
  }
  const f = content.flag;
  return (
    <div className="glass floatcard" id="fc" aria-live="polite">
      <div className="fc-head">
        <Plate plate={f.plate} />
        <span className="subtle" style={SMALL}>
          {f.trip}
        </span>
      </div>
      <p className="route">{f.who}</p>
      <dl>
        {f.rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{"confidence" in r ? <Confidence level={r.confidence} lang="en" /> : r.value}</dd>
          </div>
        ))}
      </dl>
      <Money as="p" className="amt" lit="loss" inr={f.inr} />
      <Link className="btn btn-lamp" href={f.cta.href}>
        {f.cta.text}
        <Icon name="right" />
      </Link>
    </div>
  );
}
