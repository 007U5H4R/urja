import { Fragment } from "react";

import { ChartDefs, frameProps, kindAt, ref, subtleText, useChartUid, type ChartFrameProps, type Kinds } from "./defs";

/** 'flag' = the unaccounted drop (loss), 'fuel' = a refuel (glows), anything else = context. */
export type WaveKind = "flag" | "fuel" | "move";

export interface WaveNote {
  /** Sample index the note is anchored to. */
  i: number;
  y: number;
  a?: "start" | "middle" | "end";
  text: string;
  /** CSS colour; default var(--fg-muted). */
  c?: string;
  /** Font weight; default 400. */
  w?: number;
  fs?: number;
}

export type WaveProps = ChartFrameProps & {
  /** Litres in the tank per sample, drawn above the axis. */
  fuel: readonly number[];
  /** km/h per sample, mirrored below the axis. */
  speed: readonly number[];
  kind: Kinds<WaveKind>;
  /** Inclusive sample range to shade as the flagged window. */
  window?: readonly [number, number];
  /** [sample index, litres] points of the dashed "without the drop" line. */
  expected?: readonly (readonly [number, number])[];
  notes?: readonly WaveNote[];
  times?: readonly { i: number; text: string }[];
  w?: number;
  h?: number;
  gap?: number;
  /** Base font size in px. */
  fs?: number;
  /** Top of the fuel scale in litres; default 320 (charts.js `FM`). */
  max?: number;
  /** Fuel gridlines; default 0, 100, 200, 300 as in charts.js. */
  ticks?: readonly number[];
  /** Speed at full depth below the axis; default 80 km/h as in charts.js. */
  speedMax?: number;
  /** Unit on the zero gridline and the speed caption. */
  fuelUnit?: string;
  speedUnit?: string;
};

const DEFAULT_TICKS = [0, 100, 200, 300] as const;

/**
 * Fuel waveform: fuel above the axis, speed mirrored below it. A port of charts.js `wave()`
 * with the same geometry: a stationary drop reads at a glance (top falls, bottom empty).
 */
export function Wave(props: WaveProps) {
  const uid = useChartUid(props.uid);
  const { fuel, speed, kind, window: win, expected, notes, times } = props;
  const W = props.w || 1000, H = props.h || 300, n = fuel.length, axis = H * 0.64, topH = axis - 20, botH = H - axis - 26, FM = props.max || 320;
  const gap = props.gap ?? 1.6, bw = (W - 44 - gap * (n - 1)) / n, x0 = 44;
  const fs = `${props.fs || 11}px`;
  const ticks = props.ticks ?? DEFAULT_TICKS;
  const speedMax = props.speedMax ?? 80;
  const fuelUnit = props.fuelUnit ?? "L", speedUnit = props.speedUnit ?? "km/h";

  return (
    <div {...frameProps(props, "wave-desk")}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <ChartDefs uid={uid} />
        {ticks.map((v) => {
          const y = axis - (v / FM) * topH;
          return (
            <Fragment key={v}>
              <line x1={x0} x2={W} y1={y} y2={y} style={{ stroke: "var(--line-soft)" }} />
              <text x={x0 - 8} y={y + 4} textAnchor="end" style={subtleText(fs)}>
                {`${v}${v ? "" : ` ${fuelUnit}`}`}
              </text>
            </Fragment>
          );
        })}
        {win && <WindowShade a={x0 + win[0] * (bw + gap) - 2} b={x0 + (win[1] + 1) * (bw + gap)} y={axis - topH - 6} h={topH + botH + 12} />}
        {fuel.map((v, i) => {
          const x = x0 + i * (bw + gap), h = (v / FM) * topH, k = kindAt<WaveKind>(kind, i, "move");
          const f = k === "flag" ? ref("loss", uid) : k === "fuel" ? ref("hot", uid) : ref("dim", uid);
          const sh = (speed[i] / speedMax) * botH;
          return (
            <Fragment key={i}>
              <rect
                x={x.toFixed(2)}
                y={(axis - h).toFixed(2)}
                width={bw.toFixed(2)}
                height={h.toFixed(2)}
                rx="1"
                fill={f}
                filter={k === "fuel" ? ref("glow", uid) : undefined}
              />
              {sh > 0.5 && (
                <rect x={x.toFixed(2)} y={(axis + 3).toFixed(2)} width={bw.toFixed(2)} height={sh.toFixed(2)} rx="1" fill={ref("dimdown", uid)} />
              )}
            </Fragment>
          );
        })}
        <line x1={x0} x2={W} y1={axis + 1.5} y2={axis + 1.5} style={{ stroke: "var(--line)" }} />
        {expected && (
          <polyline
            points={expected
              .map(([i, v]) => `${(x0 + i * (bw + gap) + bw / 2).toFixed(1)},${(axis - (v / FM) * topH).toFixed(1)}`)
              .join(" ")}
            style={{ fill: "none", stroke: "var(--cream)", strokeWidth: "1.6", strokeDasharray: "5 5", opacity: ".8" }}
          />
        )}
        {notes?.map((t, j) => (
          <text
            key={`n${j}`}
            x={x0 + t.i * (bw + gap)}
            y={t.y}
            textAnchor={t.a || "start"}
            style={{
              fontSize: `${t.fs || props.fs || 12}px`,
              fill: t.c || "var(--fg-muted)",
              fontWeight: String(t.w || 400),
              fontFamily: "var(--font)",
            }}
          >
            {t.text}
          </text>
        ))}
        {times?.map((t, j) => (
          <text key={`t${j}`} x={x0 + t.i * (bw + gap)} y={H - 6} textAnchor="middle" style={subtleText(fs)}>
            {t.text}
          </text>
        ))}
        <text x={x0 - 8} y={axis + 16} textAnchor="end" style={subtleText(fs)}>
          {speedUnit}
        </text>
      </svg>
    </div>
  );
}

function WindowShade({ a, b, y, h }: { a: number; b: number; y: number; h: number }) {
  return <rect x={a} y={y} width={b - a} height={h} rx="4" style={{ fill: "var(--loss-bg)" }} />;
}
