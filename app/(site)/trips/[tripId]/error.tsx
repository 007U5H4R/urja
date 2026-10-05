"use client";

import { useEffect } from "react";
import { focusPageHeading } from "@/components/states/focus";
import { TripError } from "@/components/trip/TripStates";

/**
 * Next 16 passes `retry`; older builds passed `reset`. Either re-renders the segment.
 * Focus moves to the card's h1 when it appears (TKT-11), so it never drops to <body>.
 */
export default function TripErrorBoundary({ retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    focusPageHeading();
  }, []);
  return <TripError onRetry={() => (retry ?? reset)?.()} />;
}
