/**
 * The bet's tab bar (TASK-32, EXE49): /bet was one long page; it is now seven short ones. Each
 * tab's summary is the one line its card on the overview shows. Pure copy and path matching.
 */

export type BetTabId = "overview" | "market" | "product" | "tiers" | "lender" | "plan" | "artifacts";

export interface BetTab {
  id: BetTabId;
  label: string;
  href: string;
  /** One line for the tab's card on the overview. */
  summary: string;
}

/** The tab bar's accessible name. */
export const BET_TABS_LABEL = "The bet";

export const BET_TABS: readonly BetTab[] = [
  { id: "overview", label: "Overview", href: "/bet", summary: "The bet in one loop, three numbers and a map of the tabs." },
  { id: "market", label: "Where we play", href: "/bet/market", summary: "The board of segments and jobs, what we dropped, and structural shifts vs hype." },
  { id: "product", label: "Product", href: "/bet/product", summary: "The 5–10x over today, and how independent streams unlock autonomy." },
  { id: "tiers", label: "Tiers", href: "/bet/tiers", summary: "Four tiers, what each costs to serve, and who pays for Free." },
  { id: "lender", label: "Lender view", href: "/trucks/rj14-gb-4521", summary: "One truck's verified ledger, read the way a lender would." },
  { id: "plan", label: "Plan", href: "/bet/plan", summary: "The roadmap, the North Star in two layers, and the seven hypotheses, not field-tested yet." },
  { id: "artifacts", label: "Artifacts", href: "/bet/artifacts", summary: "The strategy doc, PRD, deck, pitch script, research report, bet spec and decisions log." },
];

/** The tab a path is under: any truck page is the lender view; anything else outside the bet is none. */
export function betTabForPath(pathname: string): BetTabId | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (/^\/trucks\/[^/]+$/.test(path)) return "lender";
  return BET_TABS.find((t) => t.id !== "lender" && t.href === path)?.id ?? null;
}
