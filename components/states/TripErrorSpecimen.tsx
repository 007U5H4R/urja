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
  return (
    <TripError
      onRetry={() => {
        router.replace(workingHref(window.location.href));
        void focusNextPageHeading();
      }}
    />
  );
}
