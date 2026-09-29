import type { IconName } from "@/components/ui/Icon";
import type { Lang } from "@/lib/data/types";

/** Every menu destination, as a literal union: a label table keyed by it must cover each one. */
export const MENU_HREFS = ["/brief", "/", "/#trucks", "/trips", "/why"] as const;
export type MenuHref = (typeof MENU_HREFS)[number];
export type PillHref = Exclude<MenuHref, "/brief">;

export type NavPill = { href: PillHref; label: string; icon: IconName };
export type MenuLink = { href: MenuHref; label: string };

// The top-bar pills keep Next's default prefetch. The phone menu's links pass
// prefetch={false}: they are only in view once the menu is opened, and the
// phone shouldn't spend data on every destination on every load.

/** Why Urja has its own top bar (final/why.html): no Ask trigger or fleet chip, a "Start the demo" button. */
export const WHY_HREF = "/why" satisfies MenuHref;

/** Top-bar pills (technical-plan §3; final/index.html lines 20–23). */
export const NAV_PILLS: readonly NavPill[] = [
  { href: "/", label: "Today", icon: "today" },
  { href: "/#trucks", label: "Trucks", icon: "truck" },
  { href: "/trips", label: "Trips", icon: "route" },
  { href: WHY_HREF, label: "Why Urja", icon: "book" },
];

/** The ≤760px menu adds Morning brief; Ask Urja is appended by MobileMenu. */
export const MENU_LINKS: readonly MenuLink[] = [
  { href: "/brief", label: "Morning brief" },
  ...NAV_PILLS.map(({ href, label }) => ({ href, label })),
];

/**
 * EXE23: on a Hindi phone screen (/brief, /message with lang=hi) the menu is
 * Hindi. "सुबह का हिसाब" is the brief's own Hindi heading. Every string is listed
 * in docs/exec/hindi-review.md ("Phone menu"). Everywhere else it is English.
 */
const MENU_LABEL_HI: Record<MenuHref, string> = {
  "/brief": "सुबह का हिसाब",
  "/": "आज",
  "/#trucks": "ट्रक",
  "/trips": "ट्रिप",
  "/why": "Urja क्यों",
};

const MENU_LINKS_HI: readonly MenuLink[] = MENU_LINKS.map(({ href }) => ({ href, label: MENU_LABEL_HI[href] }));

/** The menu's destinations in `lang`: the same hrefs, in the same order. */
export function menuLinks(lang: Lang): readonly MenuLink[] {
  return lang === "hi" ? MENU_LINKS_HI : MENU_LINKS;
}

/** The menu's own labels: the toggle's aria-label, the list's aria-label and the Ask item. */
export const MENU_COPY: Record<Lang, { toggle: string; nav: string; ask: string }> = {
  en: { toggle: "Menu", nav: "Main (mobile)", ask: "Ask Urja" },
  hi: { toggle: "मेनू", nav: "मुख्य मेनू", ask: "Urja से पूछें" },
};

/** Whether `href` is the page at `pathname`. In-page anchors are never current. */
export function isCurrent(href: string, pathname: string): boolean {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Whether `pathname` is the Why Urja page. */
export function isWhyRoute(pathname: string): boolean {
  return isCurrent(WHY_HREF, pathname);
}

/**
 * EXE12: the phone screens (final/brief.html, final/message.html) carry their own
 * top bar and menu, so the global TopBar is not rendered there.
 */
export const PHONE_ROUTES: readonly string[] = ["/brief", "/message"];

/** Whether `pathname` is one of the phone screens (a trailing slash is allowed). */
export function isPhoneRoute(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PHONE_ROUTES.includes(p);
}

/** The 1200 × 630 link-preview card that scripts/render-og.ts screenshots (technical-plan §9). */
export const OG_CARD_PATH = "/og-card";

/** Routes that render without the global TopBar: the phone screens (EXE12) and the OG card. */
export function hidesTopBar(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return isPhoneRoute(p) || p === OG_CARD_PATH;
}
