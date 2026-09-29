export interface MeterProps {
  /** The measured value, e.g. the wrong-flag rate. */
  value: number;
  /** Where the limit mark sits, on the same scale. */
  limit: number;
  /** The right end of the scale. */
  max: number;
  /** Left, middle and right captions under the bar (`.meter-l`), from the view model. */
  labels?: readonly [string, string, string];
}

/** Share of the scale as a CSS percentage, clamped to 0–100%; a scale of max ≤ 0 gives 0%. */
const pct = (v: number, max: number) => `${max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0}%`;

/**
 * A meter with a limit mark (final/index.html lines 124–125; lamp.css `.meter`). Decorative:
 * the chart above it carries the numbers in its aria-label.
 */
export function Meter({ value, limit, max, labels }: MeterProps) {
  return (
    <>
      <div className="meter" aria-hidden="true">
        <span className="val" style={{ width: pct(value, max) }}></span>
        <span className="lim" style={{ left: pct(limit, max) }}></span>
      </div>
      {labels && (
        <div className="meter-l" aria-hidden="true">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
          <span>{labels[2]}</span>
        </div>
      )}
    </>
  );
}
