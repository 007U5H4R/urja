import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetHead } from "@/components/bet/BetHead";
import { ClaimList } from "@/components/bet/ClaimList";
import { SimulatedTag } from "@/components/bet/SimulatedTag";
import { Sources } from "@/components/bet/Sources";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";
import { BET_TRUCK } from "@/content/bet/copy";
import { citedSourceIds } from "@/content/bet/sources";
import { getTruckSlugs, slugToPlate } from "@/lib/bet/slug";
import { trucks } from "@/lib/data/aggregates";
import { formatKm } from "@/lib/format";
import { truckMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";

type Params = { params: Promise<{ plate: string }> };

/** Every truck is prerendered from its slug ("rj14-gb-4521"); any other slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getTruckSlugs().map((plate) => ({ plate }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const plate = slugToPlate((await params).plate);
  return (plate ? truckMetadata(plate) : null) ?? {};
}

/**
 * TASK-21: the shell of the lender view of one truck (bet-spec §8). TASK-26 adds the trust
 * score, the daily ledger and the verified-days slots. The figures are the truck's trucks() row.
 */
export default async function TruckPage({ params }: Params) {
  const plate = slugToPlate((await params).plate);
  const row = plate ? trucks().find((t) => t.plate === plate) : undefined;
  // A guard only: with dynamicParams = false, Next answers any other slug with the 404 first.
  if (!row) notFound();
  const c = BET_TRUCK;
  const order = citedSourceIds(c.claims);
  return (
    <main className="wrap bet" id="main">
      <BetHead
        eyebrow={`${c.eyebrowPrefix} · ${row.driver.en}, driver since ${row.since}`}
        h1={
          <>
            <Plate plate={row.plate} size="lg" /> {c.h1Suffix}
          </>
        }
        thesis={c.thesis}
      />
      <section className="panel bet-sec" aria-labelledby="bet-september">
        <div className="sec-head">
          <h2 id="bet-september">September</h2>
          <span className="right">
            <SimulatedTag />
          </span>
        </div>
        <dl className="bet-figures">
          <div>
            <dt>Profit</dt>
            <dd>
              <Money inr={row.profitInr} />
            </dd>
          </div>
          <div>
            <dt>Trips</dt>
            <dd>{row.trips}</dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>{formatKm(row.km)}</dd>
          </div>
        </dl>
      </section>
      <section className="panel bet-sec" aria-labelledby="bet-lenders">
        <div className="sec-head">
          <h2 id="bet-lenders">Why a lender would care</h2>
        </div>
        <ClaimList claims={c.claims} order={order} />
      </section>
      <Sources ids={order} />
    </main>
  );
}
