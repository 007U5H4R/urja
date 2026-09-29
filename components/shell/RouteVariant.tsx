"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { hidesTopBar, isWhyRoute } from "./nav";

/**
 * Renders `why` on the Why Urja page and `children` everywhere else, so the
 * TopBar (a server component) can swap its slots per route without adding elements.
 */
export function RouteVariant({ why, children }: { why: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return <>{isWhyRoute(pathname) ? why : children}</>;
}

/** Renders nothing where the TopBar is hidden (the phone screens, EXE12, and /og-card), `children` everywhere else. */
export function HideOnBarlessRoutes({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return <>{hidesTopBar(pathname) ? null : children}</>;
}
