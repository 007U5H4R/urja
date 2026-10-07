import type { Metadata } from "next";
import { BetHead } from "@/components/bet/BetHead";
import { ClaimList } from "@/components/bet/ClaimList";
import { Sources } from "@/components/bet/Sources";
import { BET_OVERVIEW } from "@/content/bet/copy";
import { citedSourceIds } from "@/content/bet/sources";
import { betMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";

// TASK-21: the shell of /bet (docs/bet/bet-spec.md). TASK-28 adds the board, the loop and the roadmap.
// Not linked from the nav; /why links here in TASK-29.
export const metadata: Metadata = betMetadata();

export default function BetPage() {
  const c = BET_OVERVIEW;
  const order = citedSourceIds(c.claims);
  return (
    <main className="wrap bet" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <section className="panel bet-sec" aria-labelledby="bet-why-now">
        <div className="sec-head">
          <h2 id="bet-why-now">Why now</h2>
        </div>
        <ClaimList claims={c.claims} order={order} />
      </section>
      <Sources ids={order} />
    </main>
  );
}
