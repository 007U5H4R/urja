import type { TEASERS } from "@/content/bet/overview";
import type { TierRowView } from "@/lib/bet/views/tiers";
import type { TruckView } from "@/lib/bet/views/truck";
import { OvSection } from "./OvSection";

export interface TeasersProps {
  copy: typeof TEASERS;
  /** From getTiersView(): each tier's name and price. */
  tiers: readonly Pick<TierRowView, "id" | "name" | "price" | "unit">[];
  /** From getTruckView(): the plate, the trust score and the verified days. */
  truck: { plate: TruckView["plate"]; scoreText: string; scoreLabel: string; verifiedText: string };
}

/** The tiers and the lender view, one line each, side by side; each links to its own page. */
export function Teasers({ copy, tiers, truck }: TeasersProps) {
  return (
    <div className="ov-teasers">
      <OvSection id="tiers" aside={tiers[0]?.unit} className="ov-teaser">
        <p className="ov-teaser-line">{copy.tiers.line}</p>
        <ul className="ov-prices">
          {tiers.map((t) => (
            <li key={t.id}>
              <span className="ov-price-name">{t.name}</span>
              <span className="ov-price">{t.price}</span>
            </li>
          ))}
        </ul>
        <a className="btn btn-line ov-teaser-link" href={copy.tiers.link.href}>
          {copy.tiers.link.label}
          <span aria-hidden="true"> →</span>
        </a>
      </OvSection>
      <OvSection id="lender" className="ov-teaser">
        <p className="ov-teaser-line">{copy.lender.line}</p>
        <p className="ov-lender">
          <span className="plate">{truck.plate}</span>
          <span className="ov-lender-fig">
            <span className="ov-lender-label">{copy.lender.scoreLabel}</span> <strong>{truck.scoreText}</strong>{" "}
            <span className="ov-lender-label">{truck.scoreLabel}</span>
          </span>
          <span className="ov-lender-days">{truck.verifiedText}</span>
        </p>
        <a className="btn btn-line ov-teaser-link" href={copy.lender.link.href}>
          {copy.lender.link.label}
          <span aria-hidden="true"> →</span>
        </a>
      </OvSection>
    </div>
  );
}
