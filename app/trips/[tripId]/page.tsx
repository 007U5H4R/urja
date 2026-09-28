import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlagCard } from "@/components/trip/FlagCard";
import { FuelSpeedChart } from "@/components/trip/FuelSpeedChart";
import { Timeline } from "@/components/trip/Timeline";
import { TripHead } from "@/components/trip/TripHead";
import { TripLedger } from "@/components/trip/TripLedger";
import { TripMapSlot } from "@/components/trip/TripMapSlot";
import { Icon } from "@/components/ui/Icon";
import { getTripIds, getTripView } from "@/lib/data/views/trip";

type Params = { params: Promise<{ tripId: string }> };

/** Every trip is prerendered; any other id is a 404 (technical-plan §2 review focus #3). */
export const dynamicParams = false;

export function generateStaticParams() {
  return getTripIds().map((tripId) => ({ tripId }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const v = getTripView((await params).tripId);
  return v ? { title: v.title } : {};
}

/** Trip evidence (final/trip.html): a static server component built from the TripView. */
export default async function TripPage({ params }: Params) {
  const v = getTripView((await params).tripId);
  // A guard only: with dynamicParams = false, Next answers any id outside
  // generateStaticParams with the root 404 before this page runs.
  if (!v) notFound();
  return (
    <main className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Today</Link>
        <Icon name="right" />
        {v.crumbs.viaEyes && (
          <>
            <Link href="/">Needs your eyes</Link>
            <Icon name="right" />
          </>
        )}
        <span aria-current="page">{v.crumbs.current}</span>
      </nav>

      <TripHead head={v.head} />

      <section className="trip-grid">
        {/* verdict first in reading order; placed right of the map on wide screens */}
        <FlagCard card={v.card} driver={v.driver} />
        <TripMapSlot map={v.map} rail={v.rail} />
      </section>

      <FuelSpeedChart chart={v.chart} />

      <section className="lower">
        <Timeline events={v.timeline} />
        <TripLedger ledger={v.ledger} normal={v.routeNormal} />
      </section>
    </main>
  );
}
