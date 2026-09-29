import { Fragment } from "react";

import { ChartDefs, frameProps, ref, subtleText, useChartUid, type ChartFrameProps } from "./defs";

export type BricksProps = ChartFrameProps & {
  /** Each column is a stack of `n` blocks, the first `lit` of them lit from the bottom. */
  cols: readonly { n: number; lit: number }[];
  /** Blocks per row; default 4. */
  per?: number;
  labels?: readonly string[];
  w?: number;
  h?: number;
};

/** Brick columns: a port of charts.js `bricks()` with the same geometry. */
export function Bricks(props: BricksProps) {
  const uid = useChartUid(props.uid);
  const { cols, labels } = props;
  const W = props.w || 300, H = props.h || 96, per = props.per || 4, bottom = labels ? 16 : 2;
  const cg = 10, colW = (W - cg * (cols.length - 1)) / cols.length, b = (colW - (per - 1) * 2) / per;
  const rowsMax = Math.max(...cols.map((c) => Math.ceil(c.n / per)));
  const bh = Math.min(b * 0.62, (H - bottom - 4 - (rowsMax - 1) * 2) / rowsMax);

  return (
    <div {...frameProps(props, "chart")}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <ChartDefs uid={uid} />
        {cols.map((c, ci) => {
          const x0 = ci * (colW + cg);
          const blocks = Array.from({ length: c.n }, (_, k) => {
            const r = Math.floor(k / per), cx = k % per;
            const x = x0 + cx * (b + 2), y = H - bottom - (r + 1) * bh - r * 2;
            return k < c.lit ? (
              <rect key={k} x={x.toFixed(2)} y={y.toFixed(2)} width={b.toFixed(2)} height={bh.toFixed(2)} rx="1.2" fill={ref("lit", uid)} />
            ) : (
              <rect
                key={k}
                x={(x + 0.5).toFixed(2)}
                y={(y + 0.5).toFixed(2)}
                width={(b - 1).toFixed(2)}
                height={(bh - 1).toFixed(2)}
                rx="1.2"
                style={{ fill: "oklch(0.22 0.006 60)", stroke: "oklch(0.36 0.008 60)" }}
              />
            );
          });
          return (
            <Fragment key={ci}>
              {blocks}
              {labels && (
                <text x={(x0 + colW / 2).toFixed(1)} y={H - 3} textAnchor="middle" style={subtleText("10.5px")}>
                  {labels[ci]}
                </text>
              )}
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
