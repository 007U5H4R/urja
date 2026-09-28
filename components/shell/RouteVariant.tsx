"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isWhyRoute } from "./nav";

/**
 * Renders `why` on the Why Urja page and `children` everywhere else, so the
 * server-rendered TopBar can swap its slots per route without adding elements.
 */
export function RouteVariant({ why, children }: { why: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return <>{isWhyRoute(pathname) ? why : children}</>;
}
