import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetHead } from "@/components/bet/BetHead";
import { Sources } from "@/components/bet/Sources";
import { truckClaims } from "@/components/truck/claims";
import { DailyLedger } from "@/components/truck/DailyLedger";
import { LoanReadiness } from "@/components/truck/LoanReadiness";
import { TruckFigures } from "@/components/truck/TruckFigures";
import { TruckFlags } from "@/components/truck/TruckFlags";
import { TrustScore } from "@/components/truck/TrustScore";
import { VerifiedDays } from "@/components/truck/VerifiedDays";
import { Plate } from "@/components/ui/Plate";
import { BET_TRUCK } from "@/content/bet/copy";
import { citedSourceIds } from "@/content/bet/sources";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import { getTruckSlugs, slugToPlate } from "@/lib/bet/slug";
import { getTruckView } from "@/lib/bet/views/truck";
import { truckMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/truck/truck.css";

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
 * The lender view of one truck (bet-spec §8; TASK-21 shell, TASK-26 content): how a verified
 * per-truck ledger becomes something a lender could use. Every figure, note and claim comes from
 * getTruckView(); the sections run head → trust score → daily ledger → verified days → loan
 * readiness → flags, and the page ends with the Sources its claims cite.
 */
export default async function TruckPage({ params }: Params) {
  const view = getTruckView((await params).plate);
  // A guard only: with dynamicParams = false, Next answers any other slug with the 404 first.
  if (!view) notFound();
  const c = BET_TRUCK;
  const order = citedSourceIds(truckClaims(view));
  return (
    <main className="wrap bet tk" id="main">
      <BetHead
        eyebrow={`${c.eyebrowPrefix} · ${view.headline.driver}, ${TRUCK_COPY.driverSince} ${view.headline.since}`}
        h1={
          <>
            <Plate plate={view.plate} size="lg" /> {c.h1Suffix}
          </>
        }
        thesis={c.thesis}
      />
      <TruckFigures headline={view.headline} resolution={view.resolution} />
      <TrustScore trust={view.trust} order={order} />
      <DailyLedger daily={view.daily} verified={view.verified} completeness={view.completeness} resolution={view.resolution} />
      <VerifiedDays verified={view.verified} months={view.months} order={order} />
      <LoanReadiness loan={view.loan} betClaims={c.claims} order={order} />
      <TruckFlags flags={view.flagList} />
      <Sources ids={order} />
    </main>
  );
}
