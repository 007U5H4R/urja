import type { Metadata } from "next";
import { BetHead } from "@/components/bet/BetHead";
import { ClaimList } from "@/components/bet/ClaimList";
import { Sources } from "@/components/bet/Sources";
import { CostTable } from "@/components/bet/tiers/CostTable";
import { PriceChart } from "@/components/bet/tiers/PriceChart";
import { TierTable } from "@/components/bet/tiers/TierTable";
import { WhoPays } from "@/components/bet/tiers/WhoPays";
import { BET_TIERS } from "@/content/bet/copy";
import { getTiersView } from "@/lib/bet/views/tiers";
import { betTiersMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/tiers/tiers.css";

// TASK-27: /bet/tiers (bet-spec §7): the tier table, the price logic, cost to serve, who pays,
// and the sources. Every figure comes from getTiersView(); BET_TIERS.claims are the same Claim
// objects the view renders, so <Sources> covers every [n] on the page.
export const metadata: Metadata = betTiersMetadata();

export default function BetTiersPage() {
  const c = BET_TIERS;
  const view = getTiersView();
  const order = view.sourceIds;
  return (
    <main className="wrap bet bet-tiers" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />

      <TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />

      <section className="panel bet-sec" aria-labelledby="logic-h">
        <div className="sec-head">
          <h2 id="logic-h">Why these prices</h2>
        </div>
        <PriceChart chart={view.priceChart} recovered={view.recovered} />
        <div className="bet-logic-claims">
          <h3>What the prices are anchored on</h3>
          <ClaimList claims={view.anchors} order={order} />
        </div>
      </section>

      <CostTable costs={view.costs} order={order} />

      <WhoPays rows={view.whoPays} steps={view.subsidySteps} subsidy={view.subsidy} subsidyClaims={view.subsidyClaims} order={order} />

      <Sources ids={order} />
    </main>
  );
}
