"use client";

import { Suspense, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { parseState, type ScreenState } from "@/lib/state";

// The URL's query as an external store: back/forward fire popstate; Next's own
// navigations (router.replace, <Link>) are relayed by <QueryWatcher/>.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
};
const clientSearch = () => window.location.search;
const serverSearch = () => "";

/**
 * Tells the store when Next's router changes the query. It renders nothing, so
 * its Suspense boundary (which useSearchParams needs on a static route) holds
 * nothing of the page.
 */
function QueryWatcher() {
  const params = useSearchParams();
  useEffect(notify, [params]);
  return null;
}

/**
 * `?state=` on a statically prerendered route (Today, Trip). The server knows no
 * query, so the prerendered HTML is always the working view (children) and the
 * route stays static. After hydration the query is read from the URL, and a
 * supported state swaps in its specimen; anything else keeps the working view.
 * (A server read of searchParams would make the whole route dynamic.)
 * Intended trade-off (TKT-11): every specimen ships in the page payload, and a
 * ?state= link shows the working view until hydration, so that / stays static.
 */
export function StateSwitch({ specimens, children }: { specimens: Partial<Record<ScreenState, ReactNode>>; children: ReactNode }) {
  const search = useSyncExternalStore(subscribe, clientSearch, serverSearch);
  const state = parseState(new URLSearchParams(search), Object.keys(specimens) as ScreenState[]);
  return (
    <>
      <Suspense fallback={null}>
        <QueryWatcher />
      </Suspense>
      {state ? specimens[state] : children}
    </>
  );
}
