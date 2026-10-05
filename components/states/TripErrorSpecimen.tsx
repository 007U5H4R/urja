"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TripError } from "@/components/trip/TripStates";
import { focusNextPageHeading, focusPageHeading } from "./focus";
import { workingHref } from "./WorkingViewButton";

/** Trip `?state=error`: the error card (focused when it appears); its retry reloads the working trip page. */
export function TripErrorSpecimen() {
  const router = useRouter();
  useEffect(() => {
    focusPageHeading();
  }, []);
  // The wrapper (display: contents) scopes the card's touch-size rule (states.css, DES-4).
  return (
    <div className="st-trip-error">
      <TripError
        onRetry={() => {
          router.replace(workingHref(window.location.href));
          void focusNextPageHeading();
        }}
      />
    </div>
  );
}
