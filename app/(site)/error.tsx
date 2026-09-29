"use client";

import Link from "next/link";
import { useEffect } from "react";
import { focusPageHeading } from "@/components/states/focus";
import { StateCard, StateView } from "@/components/states/StateCard";

/**
 * The route error boundary (TKT-11 AC2, Design.md §20): blame the system, name
 * the fix, preserve the work. It says what happened, what to do next and that
 * nothing was lost, with a visible retry. Next 16 passes `retry`; older builds
 * passed `reset`. Either re-renders the segment. Focus moves to the h1 when the
 * card appears, so it never drops to <body>.
 */
export default function RouteError({ retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    focusPageHeading();
  }, []);
  return (
    <StateView greet="Urja · Sharma Roadlines">
      <StateCard id="st-route-err" chip="Error" tone="wait" tag="this page didn’t load" role="alert">
        <h1 id="st-route-err" tabIndex={-1}>Urja couldn’t show this page.</h1>
        <p className="copy">
          Something went wrong on Urja’s side while building this view. Nothing is lost: every trip, flag and ledger is
          stored as it was, and no message was sent to any driver. Try again, or go back to Today.
        </p>
        <div className="actions">
          <button type="button" className="btn btn-lamp" onClick={() => (retry ?? reset)?.()}>
            Try again
          </button>
          <Link className="btn btn-line" href="/">
            Back to Today
          </Link>
        </div>
      </StateCard>
    </StateView>
  );
}
