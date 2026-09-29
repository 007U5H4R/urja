import type { Metadata } from "next";
import { HeroCard } from "@/components/today/HeroCard";
import { KpiCards } from "@/components/today/KpiCards";
import { LedgerBar } from "@/components/today/LedgerBar";
import { PageHead } from "@/components/today/PageHead";
import { TrucksTable } from "@/components/today/TrucksTable";
import { getToday, trucksTableView } from "@/lib/data/views/today";
import { todayMetadata } from "@/lib/metadata";

export const metadata: Metadata = todayMetadata();

/**
 * Today (final/index.html). A static server component: the view model is
 * built from the memoised dataset at build time. Phone order (Design.md §16):
 * verdict → ledger bar → needs your eyes → hero → September cards → trucks
 * (lamp.css puts the eyes list first in the stacked hero row).
 */
export default function Today() {
  const today = getToday();
  return (
    <main className="wrap">
      <PageHead greeting={today.greeting} verdict={today.verdict} tags={today.tags} />
      <LedgerBar ledger={today.ledger} />
      {/* The hero card (scene · map · fleet) and "Needs your eyes" share one selection. */}
      <HeroCard
        hero={today.hero}
        fleet={today.fleetNow}
        scene={today.heroScene}
        cities={today.mapCities}
        eyes={today.eyes}
        eyesHead={today.eyesHead}
        cleanLine={today.cleanLine}
      />
      <KpiCards september={today.september} />
      <TrucksTable trucks={trucksTableView(today.trucks)} />
    </main>
  );
}
