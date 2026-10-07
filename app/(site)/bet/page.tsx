import type { Metadata } from "next";
import { BetHead } from "@/components/bet/BetHead";
import { Sources } from "@/components/bet/Sources";
import { Autonomy } from "@/components/bet/overview/Autonomy";
import { BetLoop } from "@/components/bet/overview/BetLoop";
import { Board } from "@/components/bet/overview/Board";
import { Hypotheses } from "@/components/bet/overview/Hypotheses";
import { Metrics } from "@/components/bet/overview/Metrics";
import { OverviewNav } from "@/components/bet/overview/OverviewNav";
import { Roadmap } from "@/components/bet/overview/Roadmap";
import { Shifts } from "@/components/bet/overview/Shifts";
import { Teasers } from "@/components/bet/overview/Teasers";
import { TenX } from "@/components/bet/overview/TenX";
import { BOARD_COPY, BOARD_JOBS, BOARD_ROWS, DROPPED } from "@/content/bet/board";
import { BET_OVERVIEW } from "@/content/bet/copy";
import { HYPOTHESES, HYPOTHESES_COPY } from "@/content/bet/hypotheses";
import { HYPE, HYPE_COPY, STRUCTURAL } from "@/content/bet/hype";
import { GUARDRAILS, METRICS_COPY, NORTH_STAR, PRIMARY_METRICS } from "@/content/bet/metrics";
import { AUTONOMY, BOARD_INTRO, LOOP, TEASERS, TENX, overviewClaims } from "@/content/bet/overview";
import { NOT_BUILDING, ROADMAP, ROADMAP_COPY } from "@/content/bet/roadmap";
import { citedSourceIds } from "@/content/bet/sources";
import { getTiersView } from "@/lib/bet/views/tiers";
import { getTruckView } from "@/lib/bet/views/truck";
import { betMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/overview/overview.css";

// TASK-28: /bet, the overview of the SuprFleet bet (docs/bet/bet-spec.md): the loop, the 5–10x,
// the board, structural vs hype, streams × autonomy, the tiers and lender teasers, the roadmap,
// the metrics and the hypotheses. Every claim comes from content/bet; overviewClaims() lists them
// in page order, so <Sources> numbers every [n] on the page. Teaser figures come from the views.
export const metadata: Metadata = betMetadata();

export default function BetPage() {
  const c = BET_OVERVIEW;
  const order = citedSourceIds(overviewClaims());
  const tiers = getTiersView().rows;
  const truck = getTruckView(TEASERS.lender.slug);
  if (!truck) throw new Error(`No truck for ${TEASERS.lender.slug}`);
  return (
    <main className="wrap bet bet-overview" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <OverviewNav />
      <BetLoop loop={LOOP} order={order} />
      <TenX tenx={TENX} order={order} />
      <Board intro={BOARD_INTRO} copy={BOARD_COPY} jobs={BOARD_JOBS} rows={BOARD_ROWS} dropped={DROPPED} order={order} />
      <Shifts structural={STRUCTURAL} hype={HYPE} copy={HYPE_COPY} order={order} />
      <Autonomy autonomy={AUTONOMY} />
      <Teasers
        copy={TEASERS}
        tiers={tiers}
        truck={{ plate: truck.plate, scoreText: truck.trust.scoreText, scoreLabel: truck.trust.label, verifiedText: truck.verified.text }}
      />
      <Roadmap phases={ROADMAP} notBuilding={NOT_BUILDING} copy={ROADMAP_COPY} order={order} />
      <Metrics northStar={NORTH_STAR} primary={PRIMARY_METRICS} guardrails={GUARDRAILS} copy={METRICS_COPY} order={order} />
      <Hypotheses hypotheses={HYPOTHESES} copy={HYPOTHESES_COPY} order={order} />
      <Sources ids={order} />
    </main>
  );
}
