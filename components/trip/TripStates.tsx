import Link from "next/link";
import type { CSSProperties } from "react";

/** A static skeleton block (states.html `.sk`: surface-2, no shimmer). */
const sk = (width: string, height: number, extra?: CSSProperties): CSSProperties => ({
  display: "block",
  background: "var(--surface-2)",
  borderRadius: 6,
  width,
  height,
  ...extra,
});

/**
 * Trip loading state (Design.md §18): a skeleton of the head and the flag
 * card only. No progress is shown, because none is known.
 */
export function TripSkeleton() {
  return (
    <main className="wrap" aria-busy="true">
      <p role="status" className="sr-only">
        Loading this trip
      </p>
      <div aria-hidden="true">
        <section className="triphead">
          <div style={{ flex: "1 1 320px" }}>
            <span style={sk("60%", 36)}></span>
            <span style={sk("85%", 14, { marginTop: 12 })}></span>
          </div>
          <div style={{ flex: "0 1 220px" }}>
            <span style={sk("100%", 36)}></span>
            <span style={sk("80%", 14, { marginTop: 10 })}></span>
          </div>
        </section>
        <section className="trip-grid">
          <article className="panel flagcard" data-skeleton="flag">
            <span style={sk("40%", 26)}></span>
            <span style={sk("75%", 28)}></span>
            <span style={sk("45%", 30)}></span>
            <div className="block">
              <span style={sk("90%", 14)}></span>
              <span style={sk("82%", 14, { marginTop: 12 })}></span>
              <span style={sk("86%", 14, { marginTop: 12 })}></span>
              <span style={sk("70%", 14, { marginTop: 12 })}></span>
            </div>
          </article>
          <article className="panel mapcard" data-skeleton="map"></article>
        </section>
      </div>
    </main>
  );
}

/**
 * Trip error state (Design.md §18, §20): what happened, what to do next, and
 * that nothing was lost, with a visible retry.
 */
export function TripError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="wrap">
      <section className="pagehead" aria-labelledby="h1">
        <div>
          <p className="greet">Trip evidence</p>
          <h1 className="verdict" id="h1">
            Couldn’t load this trip
          </h1>
          <p className="mt-3 text-[var(--fg-muted)]">
            Urja couldn’t read this trip’s records just now. Nothing is lost: the trip, its flags and its ledger are unchanged. Try again, or go back to Today.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-lamp" onClick={onRetry}>
              Try again
            </button>
            <Link className="btn btn-line" href="/">
              Back to Today
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
