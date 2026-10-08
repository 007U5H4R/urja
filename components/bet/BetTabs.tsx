import { BET_TABS, BET_TABS_LABEL, betTabForPath } from "@/content/bet/tabs";
import { TabsScroller } from "./TabsScroller";
import "./bet-tabs.css";

export interface BetTabsProps {
  /** The page's path; the tab it is under is marked current (any truck page is the lender view). */
  path: string;
}

/**
 * TASK-32 (EXE49): the bet's tab bar, under the head of every bet page. Plain links in a
 * navigation landmark; the current one carries aria-current="page". On a phone the row scrolls
 * sideways inside <TabsScroller>, which centres the current tab; the page never scrolls.
 */
export function BetTabs({ path }: BetTabsProps) {
  const current = betTabForPath(path);
  return (
    <nav className="bet-tabs" aria-label={BET_TABS_LABEL}>
      <TabsScroller>
        <ul className="bet-tabs-list">
          {BET_TABS.map((t) => (
            <li key={t.id}>
              <a href={t.href} aria-current={t.id === current ? "page" : undefined}>
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </TabsScroller>
    </nav>
  );
}
