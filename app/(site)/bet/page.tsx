import type { Metadata } from "next";
import { Assumptions } from "@/components/bet/Assumptions";
import { BetHead } from "@/components/bet/BetHead";
import { BetTabs } from "@/components/bet/BetTabs";
import { Sources } from "@/components/bet/Sources";
import { BetLoop } from "@/components/bet/overview/BetLoop";
import { Headlines } from "@/components/bet/overview/Headlines";
import { StartHere } from "@/components/bet/overview/StartHere";
import { BET_OVERVIEW } from "@/content/bet/copy";
import { HEADLINES, LOOP, TEASERS, deferredAssumptions, overviewSummaryClaims } from "@/content/bet/overview";
import { citedSourceIds } from "@/content/bet/sources";
import { BET_TABS } from "@/content/bet/tabs";
import { getTiersView } from "@/lib/bet/views/tiers";
import { getTruckView } from "@/lib/bet/views/truck";
import { betMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/overview/overview.css";

// TASK-28; made short by TASK-32 (EXE49): /bet, the overview of the SuprFleet bet: the loop, three
// numbers, and a card for each of the other tabs. The tiers and lender cards keep their teaser
// figures, from the views. overviewSummaryClaims() lists the page's claims in page order, so
// <Sources> numbers every [n] on it; the assumptions' bases wait in <Assumptions>.
export const metadata: Metadata = betMetadata();

export default function BetPage() {
  const c = BET_OVERVIEW;
  const claims = overviewSummaryClaims();
  const order = citedSourceIds(claims);
  const tiers = getTiersView().rows;
  const truck = getTruckView(TEASERS.lender.slug);
  if (!truck) throw new Error(`No truck for ${TEASERS.lender.slug}`);
  return (
    <main className="wrap bet bet-overview" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <BetTabs path={c.path} />
      <BetLoop loop={LOOP} order={order} />
      <Headlines headlines={HEADLINES} order={order} />
      <StartHere
        tabs={BET_TABS}
        tiers={tiers}
        truck={{ plate: truck.plate, scoreText: truck.trust.scoreText, scoreLabel: truck.trust.label, verifiedText: truck.verified.text }}
      />
      <Assumptions claims={deferredAssumptions(claims)} order={order} />
      <Sources ids={order} />
    </main>
  );
}
