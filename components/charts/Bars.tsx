import { Fragment } from "react";

import { ChartDefs, frameProps, kindAt, ref, subtleText, useChartUid, type ChartFrameProps, type Kinds } from "./defs";

/** 'hot' = the one bar that matters (glows), 'lit' = attention, 'loss', 'dim' = context, 'hatch' = not yet happened. */
export type BarKind = "hot" | "lit" | "loss" | "dim" | "hatch";

export type BarsProps = ChartFrameProps & {
  values: readonly number[];
  /** Per bar; default all 'dim'. */
  kind?: Kinds<BarKind>;
  /** Scale top; default 1.05 × the largest value. */
  max?: number;
  /** One label per bar; `null` for none. */
  labels?: readonly (string | number | null)[];
  /** A lamp bracket over bars `from`…`to` (inclusive). */
  bracket?: { from: number; to: number };
  /** Diagonal stripes over lit and hot bars. */
  stripes?: boolean;
  /** A dashed reference line at value `v` (e.g. the route's normal). charts.js calls it `ref`,
   *  which React reserves, hence the rename. */
  refLine?: { v: number };
  w?: number;
  h?: number;
  gap?: number;
};

/** Focus-and-context vertical bars: a port of charts.js `bars()` with the same geometry. */
export function Bars(props: BarsProps) {
  const uid = useChartUid(props.uid);
  const { values, kind, labels, bracket, stripes } = props;
  const W = props.w || 300, H = props.h || 96, n = values.length;
  const top = bracket ? 22 : 4, bottom = labels ? 16 : 2, ch = H - top - bottom;
  // n = 0 draws only the baseline; all-zero values fall back to a scale of 1 (no NaN).
  const gap = props.gap ?? (n ? Math.max(1.5, (W / n) * 0.28) : 0), bw = n ? (W - gap * (n - 1)) / n : 0;
  const max = props.max || Math.max(0, ...values.map((v) => v ?? 0)) * 1.05 || 1;
  const r = Math.min(2, bw / 3);

  return (
    <div {...frameProps(props, "chart")}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <ChartDefs uid={uid} />
        <line x1="0" x2={W} y1={top + ch + 0.5} y2={top + ch + 0.5} style={{ stroke: "var(--line)" }} />
        {values.map((v, i) => {
          const k = kindAt<BarKind>(kind, i, "dim");
          const h = Math.max(2, (v / max) * ch), x = i * (bw + gap), y = top + ch - h;
          const box = { x: x.toFixed(2), y: y.toFixed(2), width: bw.toFixed(2), height: h.toFixed(2), rx: r };
          return (
            <Fragment key={i}>
              <rect {...box} fill={ref(k, uid)} filter={k === "hot" ? ref("glow", uid) : undefined} />
              {stripes && (k === "lit" || k === "hot") && <rect {...box} fill={ref("stripe", uid)} />}
              {k === "hatch" && (
              <rect
                x={(x + 0.5).toFixed(2)}
                y={(y + 0.5).toFixed(2)}
                width={(bw - 1).toFixed(2)}
                height={(h - 1).toFixed(2)}
                rx={r}
                style={{ fill: "none", stroke: "oklch(0.40 0.008 60)" }}
              />
              )}
            </Fragment>
          );
        })}
        {bracket && <Bracket x1={bracket.from * (bw + gap)} x2={bracket.to * (bw + gap) + bw} />}
        {labels?.map((t, i) =>
          t != null ? (
            <text key={`t${i}`} x={(i * (bw + gap) + bw / 2).toFixed(1)} y={H - 3} textAnchor="middle" style={subtleText("10.5px")}>
              {String(t)}
            </text>
          ) : null,
        )}
        {props.refLine && (
          <line
            x1="0"
            x2={W}
            y1={(top + ch - (props.refLine.v / max) * ch).toFixed(1)}
            y2={(top + ch - (props.refLine.v / max) * ch).toFixed(1)}
            style={{ stroke: "var(--cream)", strokeDasharray: "4 4", opacity: ".7" }}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

function Bracket({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <g style={{ stroke: "var(--lamp)" }}>
      <line x1={x1} x2={x2} y1="8" y2="8" />
      <line x1={x1} x2={x1} y1="4" y2="12" />
      <line x1={x2} x2={x2} y1="4" y2="12" />
    </g>
  );
}
