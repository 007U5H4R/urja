import { SimulatedTag } from "@/components/bet/SimulatedTag";
import type { PriceChartView, TiersView } from "@/lib/bet/views/tiers";
import { KeepRanges } from "./KeepRanges";

export interface PriceChartProps {
  chart: PriceChartView;
  recovered: TiersView["recovered"];
}

// Geometry. The SVG has no viewBox: x runs in % of its width, so the type stays at its real size
// on a phone, and y runs in px. Each tier is a row: its name and price, then a stem from ₹0 to
// its price on one shared ₹ axis.
const HEAD = 34; // the two line labels above the rows
const ROW = 46;
const AXIS = 26;
const X0 = 2; // % of width at ₹0
const X1 = 96; // % of width at maxInr

function pct(inr: number, max: number): string {
  return `${(X0 + (inr / max) * (X1 - X0)).toFixed(2)}%`;
}

/**
 * The price logic as a dot plot (bet-spec §7): each tier's price against cost to serve and
 * recovered ₹ (lines), and our spend estimate and the software entry tier (bands). Every reference is
 * named in the legend and labelled on the chart, and each kind has its own shape (fill, hatch,
 * dashed line, solid line, dot), so nothing rests on colour alone. The summary below is the text
 * alternative; the tier table above carries every figure.
 */
export function PriceChart({ chart, recovered }: PriceChartProps) {
  const { maxInr: max } = chart;
  const rowsTop = HEAD;
  const rowsEnd = HEAD + chart.tiers.length * ROW;
  const height = rowsEnd + AXIS;
  const cost = chart.marks.find((m) => m.id === "cost");
  const rec = chart.marks.find((m) => m.id === "recovered");

  return (
    <figure className="bet-chart">
      <ul className="pc-legend" aria-label="Chart legend">
        {chart.bands.map((b) => (
          <li key={b.id}>
            <span className={`pc-key pc-key-${b.id}`} aria-hidden="true" />
            <KeepRanges text={b.label} />
          </li>
        ))}
        {chart.marks.map((m) => (
          <li key={m.id}>
            <span className={`pc-key pc-key-${m.id}`} aria-hidden="true" />
            {m.label}
          </li>
        ))}
        <li>
          <span className="pc-key pc-key-price" aria-hidden="true" />
          Tier price
        </li>
      </ul>

      <svg
        className="pc-svg"
        width="100%"
        height={height}
        role="img"
        aria-label={chart.label}
        aria-describedby="pc-summary"
      >
        <defs>
          <pattern id="pc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className="pc-hatch-line" />
          </pattern>
        </defs>

        {/* Bands behind everything: our spend estimate (filled), the software entry tier (hatched). */}
        {chart.bands.map((b) => (
          <g key={b.id} className={`pc-band pc-band-${b.id}`}>
            <rect
              x={pct(b.lowInr, max)}
              y={rowsTop - 6}
              width={`${(((b.highInr - b.lowInr) / max) * (X1 - X0)).toFixed(2)}%`}
              height={rowsEnd - rowsTop + 6}
            />
          </g>
        ))}

        {/* Ticks and the axis. */}
        {chart.ticks.map((t, i) => (
          <g key={t.inr} className={i % 2 ? "pc-tick pc-tick-odd" : "pc-tick"}>
            <line x1={pct(t.inr, max)} x2={pct(t.inr, max)} y1={rowsTop - 6} y2={rowsEnd} />
            <text
              x={pct(t.inr, max)}
              y={rowsEnd + 18}
              textAnchor={i === 0 ? "start" : i === chart.ticks.length - 1 ? "end" : "middle"}
            >
              {t.label}
            </text>
          </g>
        ))}
        <line className="pc-axis" x1={pct(0, max)} x2={pct(max, max)} y1={rowsEnd} y2={rowsEnd} />

        {/* Cost to serve (dashed) and recovered ₹ (solid), each named at its top. */}
        {cost && (
          <g className="pc-mark pc-mark-cost">
            <line x1={pct(cost.inr, max)} x2={pct(cost.inr, max)} y1={8} y2={rowsEnd} />
            <text x={pct(cost.inr, max)} dx={5} y={12}>
              {cost.label}
            </text>
          </g>
        )}
        {rec && (
          <g className="pc-mark pc-mark-recovered">
            <line x1={pct(rec.inr, max)} x2={pct(rec.inr, max)} y1={22} y2={rowsEnd} />
            <text x={pct(rec.inr, max)} dx={-5} y={26} textAnchor="end">
              {rec.label}
            </text>
          </g>
        )}

        {/* One row per tier: name and price, then a stem from ₹0 to the price and a dot. */}
        {chart.tiers.map((t, i) => {
          const y = rowsTop + i * ROW;
          const cy = y + 30;
          const x = pct(t.priceInr, max);
          return (
            <g key={t.tierId} className={`pc-row pc-${t.tierId}`}>
              <text className="pc-name" x={pct(0, max)} y={y + 14}>
                {t.name} <tspan className="pc-price">{t.price}</tspan>
              </text>
              <line className="pc-track" x1={pct(0, max)} x2={pct(max, max)} y1={cy} y2={cy} />
              <line className="pc-stem" x1={pct(0, max)} x2={x} y1={cy} y2={cy} />
              <circle className={t.priceInr === 0 ? "pc-dot pc-dot-free" : "pc-dot"} cx={x} cy={cy} r={6} />
            </g>
          );
        })}
      </svg>

      <figcaption>
        <p id="pc-summary" className="pc-summary">
          <KeepRanges text={chart.summary} />
        </p>
        <p className="pc-note">
          <SimulatedTag />
          <span>{recovered.label}</span>
        </p>
      </figcaption>
    </figure>
  );
}
