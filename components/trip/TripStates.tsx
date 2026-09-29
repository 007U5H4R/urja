import Link from "next/link";
import type { CSSProperties } from "react";

/** A static skeleton block (states.html `.sk`: surface-2, no shimmer); size inline, as in the mockup. */
function Sk({ w, h, style }: { w: string; h: number; style?: CSSProperties }) {
  return <span className="sk" style={{ width: w, height: h, ...style }}></span>;
}

/**
 * Trip loading state (Design.md §18): a skeleton of the head and the flag
 * card only. No progress is shown, because none is known.
 */
export function TripSkeleton() {
  return (
    <main className="wrap">
      <p role="status" className="sr-only">
        Loading this trip
      </p>
      <div aria-hidden="true" aria-busy="true" data-skeleton="trip">
        <section className="triphead">
          <div style={{ flex: "1 1 320px" }}>
            <Sk w="60%" h={36} />
            <Sk w="85%" h={14} style={{ marginTop: 12 }} />
          </div>
          <div style={{ flex: "0 1 220px" }}>
            <Sk w="100%" h={36} />
            <Sk w="80%" h={14} style={{ marginTop: 10 }} />
          </div>
        </section>
        <section className="trip-grid">
          <article className="panel flagcard" data-skeleton="flag">
            <Sk w="40%" h={26} />
            <Sk w="75%" h={28} />
            <Sk w="45%" h={30} />
            <div className="block">
              <Sk w="90%" h={14} />
              <Sk w="82%" h={14} style={{ marginTop: 12 }} />
              <Sk w="86%" h={14} style={{ marginTop: 12 }} />
              <Sk w="70%" h={14} style={{ marginTop: 12 }} />
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
          <h1 className="verdict" id="h1" tabIndex={-1}>
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
