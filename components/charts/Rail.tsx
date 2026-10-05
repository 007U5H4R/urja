import { ChartDefs, frameProps, useChartUid, type ChartFrameProps } from "./defs";

export type RailState = "move" | "stop" | "flag" | "fuel";

export type RailProps = ChartFrameProps & {
  /** Span in minutes (or items, for the one-tick-per-trip progress rail). */
  total: number;
  /** One tick per `step`. */
  step: number;
  /** Inclusive ranges and their state; anything uncovered is 'move'. */
  segs: readonly { from: number; to: number; s: RailState }[];
  /** A lit knob at `t` with its caption (e.g. the moment of the drop). */
  knob?: { t: number; label: string };
};

const TICK: Record<RailState, { c: string; h: number; op: number }> = {
  flag: { c: "var(--loss)", h: 26, op: 1 },
  fuel: { c: "var(--cream)", h: 18, op: 1 },
  stop: { c: "oklch(0.40 0.008 60)", h: 12, op: 1 },
  move: { c: "var(--lamp)", h: 18, op: 0.78 },
};

/** The share of the rail at each end where a knob's caption needs placing (DES-10). */
export const KNOB_EDGE = 0.3;

/**
 * Which end of the rail the knob is near, or null in the middle 40% (or with no knob). The knob's
 * caption is centred above the knob, in the same row as the rail box's head (its title left, its
 * note or legend right), so near either end it would draw over them. The caller places it by
 * setting a class on the rail box (globals.css): `knob-start` / `knob-end` anchor the caption on
 * the knob's inner side, `knob-under` puts it under the rail. The rail's own markup stays the
 * mockup's (parity.test.tsx).
 */
export function knobEdge(total: number, knob?: { t: number }): "start" | "end" | null {
  if (!knob || !(total > 0)) return null;
  const at = knob.t / total;
  return at < KNOB_EDGE ? "start" : at > 1 - KNOB_EDGE ? "end" : null;
}

/** Tick rail: a port of charts.js `rail()` with the same geometry. Wrapper class `rail`. */
export function Rail(props: RailProps) {
  const uid = useChartUid(props.uid);
  const { total, step, segs, knob } = props;
  if (!(step > 0)) throw new RangeError(`Rail: step must be > 0, got ${step}`);
  // At least one tick; a single tick (total < step, or total ≤ 0) sits at x = 0.
  const W = 1000, H = 34, n = Math.max(1, Math.floor(total / step) + 1), dx = n > 1 ? W / (n - 1) : 0;
  const state = (t: number): RailState => {
    for (const g of segs) if (t >= g.from && t <= g.to) return g.s;
    return "move";
  };

  return (
    <div {...frameProps(props, "rail")}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <ChartDefs uid={uid} />
        {Array.from({ length: n }, (_, i) => {
          const { c, h, op } = TICK[state(i * step)];
          const x = (i * dx).toFixed(1);
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1={(H - h) / 2}
              y2={(H + h) / 2}
              style={{ stroke: c, strokeWidth: "2.2", opacity: String(op) }}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {knob && total > 0 && (
        <span className="knob" style={{ left: `${(knob.t / total) * 100}%` }}>
          <i></i>
          <b>{knob.label}</b>
        </span>
      )}
    </div>
  );
}
