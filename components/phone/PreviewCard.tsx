import Link from "next/link";
import type { MessageCopy } from "@/lib/brief/template";

const W = 150;
/** The mockup's trace: bars stand on y = 62 and the tallest is 58 high, in a 150 × 64 box. */
const BASE = 62;
const TALLEST = 58;
/** Bar width as a share of its slot (the mockup's 5.5 of 7.5). */
const FILL = 5.5 / 7.5;
const COLOUR = { flag: "var(--loss)", fuel: "var(--cream)", move: "oklch(0.48 0.008 60)" } as const;

/**
 * The link preview in the 7 AM message (final/message.html `a.pv`): the
 * brief's title, the top flag's fuel trace (the drop red, the refuel lit),
 * and the real host name (§4.9), never a domain we don't own.
 */
export function PreviewCard({ href, label, preview, host }: { href: string; label: string; preview: MessageCopy["preview"]; host: string }) {
  const trace = preview.trace;
  const n = trace?.fuel.length ?? 0;
  const slot = n ? W / n : 0;
  const top = trace ? Math.max(1, ...trace.fuel) : 1;
  return (
    <Link className="pv" href={href} aria-label={label}>
      <span className="pv-art" aria-hidden="true">
        <span className="pv-title">{preview.title}</span>
        <svg viewBox="0 0 150 64">
          <g>
            {trace?.fuel.map((litres, i) => {
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
                  style={{ fill: COLOUR[trace.kind[i]] }}
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
