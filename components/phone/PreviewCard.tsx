import Link from "next/link";
import type { MessageCopy } from "@/lib/brief/template";
import type { WaveKind } from "@/lib/data/views/trip";

const W = 150;
/** The mockup's trace: bars stand on y = 62 and the tallest is 58 high, in a 150 × 64 box. */
const BASE = 62;
const TALLEST = 58;
/** Bar width as a share of its slot (the mockup's 5.5 of 7.5). */
const FILL = 5.5 / 7.5;
const COLOUR = { flag: "var(--loss)", fuel: "var(--cream)", move: "oklch(0.48 0.008 60)" } as const;
/** The mockup draws 20 bars; a longer trace is bucketed down to at most that many (DES-23). */
const MAX_BARS = 20;

/**
 * Buckets the 10-min trace into at most MAX_BARS bars of equal runs of readings (the last may be
 * shorter), so the drop reads as a step and not as hairlines. A bucket is `flag` if any of its
 * readings is, and stands at its lowest reading, the bottom of the drop; otherwise `fuel` if it
 * holds the refuel, and it stands at the mean of its readings. Every bar is real readings.
 */
export function bucketTrace(fuel: readonly number[], kind: readonly WaveKind[]): { litres: number; kind: WaveKind }[] {
  const size = Math.max(1, Math.ceil(fuel.length / MAX_BARS));
  const bars: { litres: number; kind: WaveKind }[] = [];
  for (let from = 0; from < fuel.length; from += size) {
    const litres = fuel.slice(from, from + size);
    const kinds = kind.slice(from, from + size);
    const k: WaveKind = kinds.includes("flag") ? "flag" : kinds.includes("fuel") ? "fuel" : "move";
    bars.push({ litres: k === "flag" ? Math.min(...litres) : litres.reduce((a, b) => a + b, 0) / litres.length, kind: k });
  }
  return bars;
}

/**
 * The link preview in the 7 AM message (final/message.html `a.pv`): the
 * brief's title, the top flag's fuel trace (the drop red, the refuel lit),
 * and the real host name (§4.9), never a domain we don't own.
 */
export function PreviewCard({ href, label, preview, host }: { href: string; label: string; preview: MessageCopy["preview"]; host: string }) {
  const bars = preview.trace ? bucketTrace(preview.trace.fuel, preview.trace.kind) : [];
  const slot = bars.length ? W / bars.length : 0;
  const top = Math.max(1, ...bars.map((b) => b.litres));
  return (
    <Link className="pv" href={href} aria-label={label}>
      <span className="pv-art" aria-hidden="true">
        <span className="pv-title">{preview.title}</span>
        <svg viewBox="0 0 150 64">
          <g>
            {bars.map(({ litres, kind }, i) => {
              const h = (Math.max(0, litres) / top) * TALLEST;
              const w = slot * FILL;
              return (
                <rect
                  key={i}
                  x={(i * slot).toFixed(2)}
                  y={(BASE - h).toFixed(2)}
                  width={w.toFixed(2)}
                  height={h.toFixed(2)}
                  rx={Math.min(1, w / 3).toFixed(2)}
                  style={{ fill: COLOUR[kind] }}
                />
              );
            })}
          </g>
        </svg>
      </span>
      <span className="pv-meta">
        <b>{preview.meta}</b>
        {host}
      </span>
    </Link>
  );
}
