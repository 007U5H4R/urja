import type { CSSProperties } from "react";
import { ChartDefs, ref } from "@/components/charts/defs";
import { SimulatedTag } from "@/components/bet/SimulatedTag";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import type { TruckDayPoint, TruckView } from "@/lib/bet/views/truck";

type Verified = TruckView["verified"];

/** viewBox units per day, and the bar inside it; the HTML rows above and below use the same columns. */
const CELL = 10;
const BAR = 6;
const H = 100;
const PAD = 2;
/** A day with no trip ending, or a near-zero day, still shows a sliver on the line. */
const STUB = 1.4;

/** First day, every Monday (7, 14, 21 Sep), and the last day, dropping a Monday too close to the end. */
function tickDays(n: number): number[] {
  const ticks = [0];
  for (let i = 6; i < n - 3; i += 7) ticks.push(i);
  if (n > 1) ticks.push(n - 1);
  return ticks;
}

/** The chart's accessible name: the window, verified days, flag days, loss days and the best day, in words. */
export function ledgerSummary(daily: readonly TruckDayPoint[], verified: Verified): string {
  const s = TRUCK_COPY.ledger.summary;
  if (daily.length === 0) return s.intro;
  const first = daily[0], last = daily[daily.length - 1];
  const flagDays = daily.filter((d) => d.flags > 0).map((d) => d.label);
  const lossDays = daily.filter((d) => d.profitInr < 0).map((d) => d.label);
  const best = daily.reduce((a, d) => (d.profitInr > a.profitInr ? d : a), first);
  return [
    `${s.intro}, ${first.label} to ${last.label}: ${verified.days} of ${verified.recordedDays} days ${s.verified}.`,
    flagDays.length > 0 ? `${s.flagsOn} ${flagDays.join(", ")}.` : `${s.noFlags}.`,
    lossDays.length > 0 ? `${s.lossOn} ${lossDays.join(", ")}.` : "",
    best.profitInr > 0 ? `${s.bestDay} ${best.label}, ${best.profitText}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * September's daily profit as bars in inline SVG (the trip charts' gradients, components/charts/defs):
 * lamp-lit for a verified profit day, red below the line for a loss, dim for a day not verified.
 * Flag days get a marker above their bar and verified days a solid rail segment below (unverified:
 * hatched), so neither rests on colour alone. The labels and marks are HTML on the same day columns,
 * so the SVG can stretch to any width without distorting text; the meaning is in the aria-label and
 * a visually hidden table.
 */
export function LedgerChart({ daily, verified }: { daily: readonly TruckDayPoint[]; verified: Verified }) {
  const c = TRUCK_COPY.ledger;
  const n = daily.length;
  const W = Math.max(1, n) * CELL;
  const max = Math.max(0, ...daily.map((d) => d.profitInr));
  const min = Math.min(0, ...daily.map((d) => d.profitInr));
  const range = max - min || 1;
  const ch = H - PAD * 2;
  const zeroY = PAD + (max / range) * ch;
  const best = daily.reduce<TruckDayPoint | null>((a, d) => (d.profitInr > (a?.profitInr ?? 0) ? d : a), null);
  const worst = daily.reduce<TruckDayPoint | null>((a, d) => (d.profitInr < (a?.profitInr ?? 0) ? d : a), null);
  const cols: CSSProperties = { gridTemplateColumns: `repeat(${Math.max(1, n)}, minmax(0, 1fr))` };
  const pct = (y: number) => `${(y / H) * 100}%`;
  const yLabels = [
    ...(best ? [{ key: "max", text: best.profitText, top: pct(PAD) }] : []),
    { key: "zero", text: "0", top: pct(zeroY) },
    ...(worst ? [{ key: "min", text: worst.profitText, top: pct(H - PAD) }] : []),
  ];
  const sizer = yLabels.reduce((a, l) => (l.text.length > a.length ? l.text : a), "");
  const anyUnverified = daily.some((d) => !d.verified);
  const anyLoss = min < 0;
  const ticks = tickDays(n);

  return (
    <figure className="tk-chart">
      <div className="tk-plot" role="img" aria-label={ledgerSummary(daily, verified)}>
        <div className="tk-y" aria-hidden="true">
          <span className="tk-y-sizer">{sizer}</span>
          {yLabels.map((l) => (
            <span key={l.key} style={{ top: l.top }}>
              {l.text}
            </span>
          ))}
        </div>
        <div className="tk-flags" style={cols} aria-hidden="true">
          {daily.map((d) => (
            <span key={d.dayKey}>
              {d.flags > 0 && (
                <i className="tk-flagmark" data-flag-day={d.label}>
                  {d.flags > 1 ? d.flags : ""}
                </i>
              )}
            </span>
          ))}
        </div>
        <svg className="tk-bars" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <ChartDefs uid="tkledger" />
          {best && (
            <line
              className="tk-top"
              x1="0"
              x2={W}
              y1={PAD}
              y2={PAD}
              style={{ stroke: "var(--line-soft)", strokeDasharray: "3 4" }}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {daily.map((d, i) => {
            const x = i * CELL + (CELL - BAR) / 2;
            const idle = d.trips === 0;
            const loss = d.profitInr < 0;
            const h = idle ? STUB : Math.max(STUB, (Math.abs(d.profitInr) / range) * ch);
            const y = loss ? zeroY : zeroY - h;
            const kind = idle ? "is-idle" : loss ? "is-loss" : "is-profit";
            const fill = idle || !d.verified ? ref("dim", "tkledger") : loss ? ref("loss", "tkledger") : ref("lit", "tkledger");
            return (
              <rect
                key={d.dayKey}
                data-day={d.dayKey}
                className={d.verified ? kind : `${kind} is-unverified`}
                x={x.toFixed(2)}
                y={y.toFixed(2)}
                width={BAR}
                height={h.toFixed(2)}
                rx="1"
                fill={fill}
              />
            );
          })}
          <line
            className="tk-zero"
            x1="0"
            x2={W}
            y1={zeroY.toFixed(2)}
            y2={zeroY.toFixed(2)}
            style={{ stroke: "var(--line)" }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="tk-ver" style={cols} aria-hidden="true">
          {daily.map((d) => (
            <span key={d.dayKey} className={d.verified ? "is-verified" : "is-unverified"} />
          ))}
        </div>
        <div className="tk-x" aria-hidden="true">
          {ticks.map((i) => (
            <span
              key={i}
              className={i === 0 ? "first" : i === n - 1 ? "last" : n - 1 - i < 7 ? "near-end" : undefined}
              style={i === 0 || i === n - 1 ? undefined : { left: `${((i + 0.5) / n) * 100}%` }}
            >
              {daily[i].label}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="tk-legend">
        <span>
          <i className="sw-profit" aria-hidden="true"></i>
          {c.legend.profit}
        </span>
        {anyLoss && (
          <span>
            <i className="sw-loss" aria-hidden="true"></i>
            {c.legend.loss}
          </span>
        )}
        <span>
          <i className="tk-flagmark" aria-hidden="true"></i>
          {c.legend.flag}
        </span>
        <span>
          <i className="sw-verified" aria-hidden="true"></i>
          {c.legend.verified}
        </span>
        {anyUnverified && (
          <span>
            <i className="sw-unverified" aria-hidden="true"></i>
            {c.legend.unverified}
          </span>
        )}
      </figcaption>
      <div className="sr">
        <table>
          <caption>{c.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{c.cols.day}</th>
              <th scope="col">{c.cols.trips}</th>
              <th scope="col">{c.cols.profit}</th>
              <th scope="col">{c.cols.flags}</th>
              <th scope="col">{c.cols.verified}</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((d) => (
              <tr key={d.dayKey}>
                <th scope="row">{d.label}</th>
                <td>{d.trips}</td>
                <td>{d.profitText}</td>
                <td>{d.flags}</td>
                <td>{d.verified ? c.yes : c.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export interface DailyLedgerProps {
  daily: readonly TruckDayPoint[];
  verified: Verified;
  completeness: TruckView["completeness"];
  resolution: TruckView["resolution"];
}

/** The daily ledger panel: the chart, then how complete the data is and how the flags were settled. */
export function DailyLedger({ daily, verified, completeness, resolution }: DailyLedgerProps) {
  const c = TRUCK_COPY.ledger;
  const first = daily[0], last = daily[daily.length - 1];
  return (
    <section className="panel bet-sec tk-ledger" aria-labelledby="tk-ledger-h">
      <div className="sec-head">
        <h2 id="tk-ledger-h">{c.h2}</h2>
        {first && last && <span className="count">{`${first.label} – ${last.label}`}</span>}
        <span className="right">
          <SimulatedTag />
        </span>
      </div>
      <p className="tk-lede">{c.lede}</p>
      <LedgerChart daily={daily} verified={verified} />
      <dl className="tk-notes">
        <div>
          <dt>{c.completeness}</dt>
          <dd>
            <b>{completeness.text}</b>
            <span>{completeness.note}</span>
          </dd>
        </div>
        <div>
          <dt>{c.resolution}</dt>
          <dd>
            <b>{resolution.text.resolved}</b>
            {resolution.total > 0 && (
              <span>
                {c.flagged} {resolution.text.flagged} · {resolution.text.recovered} {c.recovered}
              </span>
            )}
            {resolution.text.driverSide && <span>{resolution.text.driverSide}</span>}
          </dd>
        </div>
      </dl>
    </section>
  );
}
