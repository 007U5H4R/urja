"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { focusNextPageHeading } from "./focus";

/** The current URL without `?state=`: the same view, working. Other params and the hash stay. */
export function workingHref(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("state");
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * A specimen's recovery button: leaves the state for the working view of the same page,
 * then moves focus to that view's h1 so it never drops to <body>.
 */
export function WorkingViewButton({ className, children }: { className: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => {
        router.replace(workingHref(window.location.href));
        void focusNextPageHeading();
      }}>
      {children}
    </button>
  );
}
