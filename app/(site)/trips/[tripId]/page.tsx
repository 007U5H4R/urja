import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimList } from "@/components/bet/ClaimList";
import { Sources } from "@/components/bet/Sources";
import { FlagCard } from "@/components/trip/FlagCard";
import { FlagLab } from "@/components/trip/FlagLab";
import { FuelSpeedChart } from "@/components/trip/FuelSpeedChart";
import { Timeline } from "@/components/trip/Timeline";
import { TripHead } from "@/components/trip/TripHead";
import { TripLedger } from "@/components/trip/TripLedger";
import { TripMapSlot } from "@/components/trip/TripMapSlot";
import { Icon } from "@/components/ui/Icon";
import { StateSwitch } from "@/components/states/StateSwitch";
import { TripErrorSpecimen } from "@/components/states/TripErrorSpecimen";
import { TripSkeleton } from "@/components/trip/TripStates";
import { FLAG_LAB_COPY, flagLabClaims } from "@/content/bet/flag-lab-copy";
import { citedSourceIds } from "@/content/bet/sources";
import { getFlagLabView } from "@/lib/bet/views/flag-lab";
import { getTripIds, getTripView } from "@/lib/data/views/trip";
import { getTripMapView } from "@/lib/data/views/trip-map";
import { tripMetadata } from "@/lib/metadata";

type Params = { params: Promise<{ tripId: string }> };

/** Every trip is prerendered; any other id is a 404 (technical-plan §2 review focus #3). */
export const dynamicParams = false;

export function generateStaticParams() {
  return getTripIds().map((tripId) => ({ tripId }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return tripMetadata((await params).tripId) ?? {};
}

/**
 * Trip evidence (final/trip.html): a static server component built from the TripView.
 * `?state=loading|error` (TKT-11) swaps in the skeleton or the error card on the
 * client, so every trip page stays prerendered. There is no loading.tsx here (EXE15):
 * its boundary made the prerendered HTML ship the skeleton first, with the real
 * <main> inside <div hidden> until a script swapped it in. ?state=loading shows it.
 *
 * A flagged, finished trip adds the flag lab (TASK-25) after the fuel chart: the client lab gets
 * the plain view, and its footer renders here on the server: the cited claims of the streams it
 * shows (a step note can quote a sourced figure) and its labelled assumptions, then the lab's own
 * numbered Sources list, which every [n] in the footer points at.
 */
export default async function TripPage({ params }: Params) {
  const v = getTripView((await params).tripId);
  // A guard only: with dynamicParams = false, Next answers any id outside
  // generateStaticParams with the root 404 before this page runs.
  if (!v) notFound();
  const lab = getFlagLabView(v.id);
  const labClaims = lab
    ? flagLabClaims(
        lab.flags.map((f) => f.rule),
        lab.flags.flatMap((f) => f.steps.map((st) => st.streamId)),
      )
    : [];
  const labSources = citedSourceIds(labClaims);
  return (
    <StateSwitch specimens={{ loading: <TripSkeleton />, error: <TripErrorSpecimen /> }}>
      <main className="wrap" id="main">
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
          <TripMapSlot map={v.map} rail={v.rail} route={getTripMapView(v.id)} />
        </section>

        <FuelSpeedChart chart={v.chart} />

        {lab && (
          <FlagLab view={lab}>
            <div className="fl-claims">
              <h3>{FLAG_LAB_COPY.claimsHeading}</h3>
              <ClaimList claims={labClaims} order={labSources} />
              <Sources ids={labSources} />
            </div>
          </FlagLab>
        )}

        <section className="lower">
          <Timeline events={v.timeline} />
          <TripLedger ledger={v.ledger} normal={v.routeNormal} />
        </section>
      </main>
    </StateSwitch>
  );
}
