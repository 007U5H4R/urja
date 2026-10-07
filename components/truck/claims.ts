import { BET_TRUCK } from "@/content/bet/copy";
import type { Claim } from "@/content/bet/sources";
import type { TruckView } from "@/lib/bet/views/truck";

/**
 * Every claim /trucks/[plate] renders, in DOM order: the trust weights and thresholds, the
 * verified-day definitions, then loan readiness (its assumptions; consent and partnership; the
 * cited rails; BET_TRUCK's claims). The page numbers its
 * Sources from this list (citedSourceIds), so [n] counts up down the page and always lands on an entry.
 */
export function truckClaims(view: TruckView): Claim[] {
  const bet: readonly Claim[] = BET_TRUCK.claims;
  return [
    ...view.trust.factors.map((f) => f.claim),
    ...view.trust.assumptions,
    ...view.verified.claims,
    ...view.loan.assumptions,
    view.loan.consent,
    view.loan.partnership,
    ...view.loan.context,
    ...bet,
  ];
}
