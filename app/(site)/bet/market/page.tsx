import type { Metadata } from "next";
import { Assumptions } from "@/components/bet/Assumptions";
import { BetHead } from "@/components/bet/BetHead";
import { BetTabs } from "@/components/bet/BetTabs";
import { Sources } from "@/components/bet/Sources";
import { Board } from "@/components/bet/overview/Board";
import { Shifts } from "@/components/bet/overview/Shifts";
import { BOARD_COPY, BOARD_JOBS, BOARD_ROWS, DROPPED } from "@/content/bet/board";
import { BET_MARKET } from "@/content/bet/copy";
import { HYPE, HYPE_COPY, STRUCTURAL } from "@/content/bet/hype";
import { BOARD_INTRO, deferredAssumptions, marketClaims } from "@/content/bet/overview";
import { citedSourceIds } from "@/content/bet/sources";
import { betMarketMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/overview/overview.css";

// TASK-32 (EXE49): /bet/market, where we play: the board (bet-spec §4) with what we dropped, and
// structural vs hype. marketClaims() lists the page's claims in page order for its own <Sources>.
export const metadata: Metadata = betMarketMetadata();

export default function BetMarketPage() {
  const c = BET_MARKET;
  const claims = marketClaims();
  const order = citedSourceIds(claims);
  return (
    <main className="wrap bet bet-overview" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <BetTabs path={c.path} />
      <Board intro={BOARD_INTRO} copy={BOARD_COPY} jobs={BOARD_JOBS} rows={BOARD_ROWS} dropped={DROPPED} order={order} />
      <Shifts structural={STRUCTURAL} hype={HYPE} copy={HYPE_COPY} order={order} />
      <Assumptions claims={deferredAssumptions(claims)} order={order} />
      <Sources ids={order} />
    </main>
  );
}
