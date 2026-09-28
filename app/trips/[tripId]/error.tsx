"use client";

import { TripError } from "@/components/trip/TripStates";

/** Next 16 passes `retry`; older builds passed `reset`. Either re-renders the segment. */
export default function TripErrorBoundary({ retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  return <TripError onRetry={() => (retry ?? reset)?.()} />;
}
