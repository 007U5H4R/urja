import { Fragment } from "react";

import { ChartDefs, frameProps, ref, useChartUid, type ChartFrameProps } from "./defs";

export type UnitKind = "lit" | "hatch" | "wrong";

export type UnitsProps = ChartFrameProps & {
  /** One square per item: lit = confirmed, hatch = waiting, wrong = a crossed-out square. */
  groups: readonly { n: number; kind: UnitKind }[];
  /** Squares per row; default all in one row. */
  perRow?: number;
  w?: number;
  h?: number;
};

/** Unit squares: a port of charts.js `units()` with the same geometry. */
export function Units(props: UnitsProps) {
  const uid = useChartUid(props.uid);
  const { groups } = props;
  const W = props.w || 300, H = props.h || 40, total = groups.reduce((a, g) => a + g.n, 0), perRow = props.perRow || total;
  const gap = 3, sq = Math.min((W - gap * (perRow - 1)) / perRow, 14), rows = Math.ceil(total / perRow);
  const y0 = H - rows * sq - (rows - 1) * gap;
  const kinds = groups.flatMap((g) => Array.from({ length: g.n }, () => g.kind));

  return (
    <div {...frameProps(props, "chart")}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <ChartDefs uid={uid} />
        {kinds.map((kind, k) => {
          const x = (k % perRow) * (sq + gap), y = y0 + Math.floor(k / perRow) * (sq + gap);
          if (kind === "lit") return <rect key={k} x={x} y={y} width={sq} height={sq} rx="2.5" fill={ref("lit", uid)} />;
          if (kind === "hatch")
            return (
              <rect
                key={k}
                x={x + 0.5}
                y={y + 0.5}
                width={sq - 1}
                height={sq - 1}
                rx="2.5"
                fill={ref("hatch", uid)}
                style={{ stroke: "oklch(0.44 0.008 60)" }}
              />
            );
          return (
            <Fragment key={k}>
              <rect
                x={x + 0.75}
                y={y + 0.75}
                width={sq - 1.5}
                height={sq - 1.5}
                rx="2.5"
                style={{ fill: "none", stroke: "var(--fg-muted)", strokeWidth: "1.5" }}
              />
              <path
                d={`M${x + 4} ${y + 4}L${x + sq - 4} ${y + sq - 4}M${x + sq - 4} ${y + 4}L${x + 4} ${y + sq - 4}`}
                style={{ stroke: "var(--fg-muted)", strokeWidth: "1.4", strokeLinecap: "round" }}
              />
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
