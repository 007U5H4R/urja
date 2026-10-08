import type { Metadata } from "next";
import { Assumptions } from "@/components/bet/Assumptions";
import { BetHead } from "@/components/bet/BetHead";
import { BetTabs } from "@/components/bet/BetTabs";
import { Sources } from "@/components/bet/Sources";
import { Hypotheses } from "@/components/bet/overview/Hypotheses";
import { Metrics } from "@/components/bet/overview/Metrics";
import { Roadmap } from "@/components/bet/overview/Roadmap";
import { BET_PLAN } from "@/content/bet/copy";
import { HYPOTHESES, HYPOTHESES_COPY } from "@/content/bet/hypotheses";
import { GUARDRAILS, METRICS_COPY, NORTH_STAR, PRIMARY_METRICS } from "@/content/bet/metrics";
import { deferredAssumptions, planClaims } from "@/content/bet/overview";
import { NOT_BUILDING, ROADMAP, ROADMAP_COPY } from "@/content/bet/roadmap";
import { citedSourceIds } from "@/content/bet/sources";
import { betPlanMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/overview/overview.css";

// TASK-32 (EXE49): /bet/plan: the roadmap and what we are not building (bet-spec §10), the metrics
// (§9) and H1–H7 (§5). planClaims() lists the page's claims for its <Sources>. The metric targets
// keep their short basis inline (EXE47), and each hypothesis keeps its own inside its details, so
// only the roadmap's and the metrics' assumptions move to <Assumptions>.
export const metadata: Metadata = betPlanMetadata();

export default function BetPlanPage() {
  const c = BET_PLAN;
  const order = citedSourceIds(planClaims());
  const deferred = deferredAssumptions([ROADMAP_COPY.claim, ROADMAP_COPY.funding, ...NORTH_STAR.definition, METRICS_COPY.claim]);
  return (
    <main className="wrap bet bet-overview" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <BetTabs path={c.path} />
      <Roadmap phases={ROADMAP} notBuilding={NOT_BUILDING} copy={ROADMAP_COPY} order={order} />
      <Metrics northStar={NORTH_STAR} primary={PRIMARY_METRICS} guardrails={GUARDRAILS} copy={METRICS_COPY} order={order} />
      <Hypotheses hypotheses={HYPOTHESES} copy={HYPOTHESES_COPY} order={order} />
      <Assumptions claims={deferred} order={order} />
      <Sources ids={order} />
    </main>
  );
}
