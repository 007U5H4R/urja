import type { CSSProperties } from "react";
import { Money } from "@/components/ui/Money";
import type { LedgerPartKey, TodayLedger } from "@/lib/data/views/today";

// final/index.html, section.ledgerbar: bar classes, legend labels and swatches.
const BAR_CLASS: Record<LedgerPartKey, string> = { diesel: "d", tolls: "t", other: "o", profit: "p" };
const LABEL: Record<LedgerPartKey, string> = { diesel: "Diesel", tolls: "Tolls", other: "Allowance & other", profit: "Profit" };
const SWATCH: Record<LedgerPartKey, CSSProperties> = {
  diesel: { background: "oklch(0.42 0.008 60)" },
  tolls: { background: "oklch(0.34 0.007 60)" },
  other: { background: "oklch(0.28 0.006 60)", boxShadow: "inset 0 0 0 1px var(--line)" },
  profit: { background: "var(--lamp)" },
};

/**
 * Yesterday's freight split into diesel, tolls, allowance & other, and profit.
 * The bar is an image named by the generated label; the legend stays readable
 * text (only its colour swatches are hidden).
 */
export function LedgerBar({ ledger }: { ledger: TodayLedger }) {
  return (
    <section className="ledgerbar">
      <div className="bar" role="img" aria-label={ledger.ariaLabel}>
        {ledger.parts.map((p) => (
          <span key={p.key} className={BAR_CLASS[p.key]} style={{ width: `${p.pct}%` }} />
        ))}
      </div>
      <p className="legend">
        <span>
          Freight billed <Money as="b" inr={ledger.freightInr} />
        </span>
        <span className="eq">=</span>
        {ledger.parts.map((p) => (
          <span key={p.key}>
            <i style={SWATCH[p.key]} aria-hidden="true" />
            {LABEL[p.key]} <Money as="b" inr={p.inr} lit={p.key === "profit"} />
          </span>
        ))}
      </p>
    </section>
  );
}
