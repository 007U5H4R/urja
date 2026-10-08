import type { BetTab } from "@/content/bet/tabs";
import type { TierRowView } from "@/lib/bet/views/tiers";
import type { TruckView } from "@/lib/bet/views/truck";
import { TEASERS } from "@/content/bet/overview";
import { OvSection } from "./OvSection";

export interface StartHereProps {
  /** BET_TABS: one card for each tab but the overview. */
  tabs: readonly BetTab[];
  /** From getTiersView(): each tier's name and price. */
  tiers: readonly Pick<TierRowView, "id" | "name" | "price" | "unit">[];
  /** From getTruckView(): the plate, the trust score and the verified days. */
  truck: { plate: TruckView["plate"]; scoreText: string; scoreLabel: string; verifiedText: string };
}

/**
 * TASK-32 (EXE49): the overview's map of the other tabs, one card each: the tab's name as its link,
 * its one-line summary, and, on Tiers and Lender view, the teaser figures from the views.
 */
export function StartHere({ tabs, tiers, truck }: StartHereProps) {
  const copy = TEASERS;
  return (
    <OvSection id="start">
      <ul className="ov-start">
        {tabs
          .filter((t) => t.id !== "overview")
          .map((t) => (
            <li key={t.id} className={`ov-start-card ov-start-${t.id}`}>
              <h3>
                <a className="ov-start-link" href={t.href}>
                  {t.label}
                </a>
              </h3>
              <p className="ov-start-line">{t.summary}</p>
              {t.id === "tiers" && (
                <>
                  <ul className="ov-prices" aria-label={`Prices, ${tiers[0]?.unit ?? ""}`.trim()}>
                    {tiers.map((tier) => (
                      <li key={tier.id}>
                        <span className="ov-price-name">{tier.name}</span>
                        <span className="ov-price">{tier.price}</span>
                      </li>
                    ))}
                  </ul>
                  {tiers[0]?.unit && <p className="ov-start-note">{tiers[0].unit}</p>}
                </>
              )}
              {t.id === "lender" && (
                <p className="ov-lender">
                  <span className="plate">{truck.plate}</span>
                  <span className="ov-lender-fig">
                    <span className="ov-lender-label">{copy.lender.scoreLabel}</span> <strong>{truck.scoreText}</strong>{" "}
                    <span className="ov-lender-label">{truck.scoreLabel}</span>
                  </span>
                  <span className="ov-lender-days">{truck.verifiedText}</span>
                </p>
              )}
            </li>
          ))}
      </ul>
    </OvSection>
  );
}
