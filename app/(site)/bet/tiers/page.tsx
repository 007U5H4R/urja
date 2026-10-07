import type { Metadata } from "next";
import { BetHead } from "@/components/bet/BetHead";
import { ClaimList } from "@/components/bet/ClaimList";
import { Sources } from "@/components/bet/Sources";
import { BET_TIERS } from "@/content/bet/copy";
import { citedSourceIds } from "@/content/bet/sources";
import { betTiersMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";

// TASK-21: the shell of /bet/tiers (bet-spec §7). TASK-27 adds the tier table and the price logic.
export const metadata: Metadata = betTiersMetadata();

export default function BetTiersPage() {
  const c = BET_TIERS;
  const order = citedSourceIds(c.claims);
  return (
    <main className="wrap bet" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <section className="panel bet-sec" aria-labelledby="bet-anchors">
        <div className="sec-head">
          <h2 id="bet-anchors">What owners pay today, and who pays for Free</h2>
        </div>
        <ClaimList claims={c.claims} order={order} />
      </section>
      <Sources ids={order} />
    </main>
  );
}
