import { Fragment } from "react";
import { ChartDefs, ref } from "@/components/charts/defs";
import type { FuelDropSeries } from "@/lib/og";

/**
 * The OG card's fuel-drop mini chart: a port of `fuelDrop()` in og/index.html with the same
 * geometry. Fuel above the line, speed mirrored below it; dim = normal, red = the drop while
 * parked (on a shaded band), one lit bar = the refuel. The bars come from lib/og.
 */
const W = 418, H = 156, AXIS = 110, TOP_H = 102, BOT_H = 36, GAP = 5;

export function FuelDrop({ series, label }: { series: FuelDropSeries; label: string }) {
  const uid = "og";
  const n = series.fuel.length;
  const bw = (W - GAP * (n - 1)) / n;
  const x = (i: number) => i * (bw + GAP);
  const win = series.window;
  return (
    <div className="fuel" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <ChartDefs uid={uid} />
        {win && (
          <rect
            x={(x(win[0]) - GAP / 2).toFixed(1)}
            y={AXIS - TOP_H - 4}
            width={((win[1] - win[0] + 1) * (bw + GAP)).toFixed(1)}
            height={TOP_H + BOT_H + 12}
            rx="6"
            style={{ fill: "var(--loss-bg)" }}
          />
        )}
        {series.fuel.map((v, i) => {
          const h = (v / series.max) * TOP_H;
          const k = series.kind[i];
          const sh = (series.speed[i] / series.speedMax) * BOT_H;
          return (
            <Fragment key={i}>
              <rect
                x={x(i).toFixed(2)}
                y={(AXIS - h).toFixed(2)}
                width={bw.toFixed(2)}
                height={h.toFixed(2)}
                rx="2"
                fill={ref(k, uid)}
                filter={k === "hot" ? ref("glow", uid) : undefined}
              />
              {sh > 0.5 && (
                <rect x={x(i).toFixed(2)} y={AXIS + 5} width={bw.toFixed(2)} height={sh.toFixed(2)} rx="2" fill={ref("dimdown", uid)} />
              )}
            </Fragment>
          );
        })}
        <line x1="0" x2={W} y1={AXIS + 2.5} y2={AXIS + 2.5} style={{ stroke: "var(--line)" }} />
      </svg>
    </div>
  );
}
