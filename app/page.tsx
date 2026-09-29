import type { Metadata } from "next";
import { HeroCard } from "@/components/today/HeroCard";
import { KpiCards } from "@/components/today/KpiCards";
import { LedgerBar } from "@/components/today/LedgerBar";
import { PageHead } from "@/components/today/PageHead";
import { TrucksTable } from "@/components/today/TrucksTable";
import { StateSwitch } from "@/components/states/StateSwitch";
import { todaySpecimens } from "@/components/states/TodayStates";
import { stateSpecimens } from "@/lib/data/views/states";
import { getToday, trucksTableView } from "@/lib/data/views/today";
import { todayMetadata } from "@/lib/metadata";
import { posterImg } from "@/components/ui/poster-img";

export const metadata: Metadata = todayMetadata();

// The scene poster in the hero card (was <Image fill preload> inside HeroCard).
const HERO_POSTER_SIZES = "(max-width: 1180px) 100vw, 60vw";
const HERO_POSTER_STYLE = { objectFit: "cover", objectPosition: "30% center" } as const;

/**
 * Today (final/index.html). A static server component: the view model is
 * built from the memoised dataset at build time. Phone order (Design.md §16):
 * verdict → ledger bar → needs your eyes → hero → September cards → trucks
 * (lamp.css puts the eyes list first in the stacked hero row).
 * `?state=loading|empty|clean|error` (TKT-11) swaps in a specimen on the client,
 * so the default render stays statically prerendered. The specimens riding in the payload
 * and the working-view flash on ?state= links are the intended price of a static /.
 */
export default function Today() {
  const today = getToday();
  return (
    <StateSwitch specimens={todaySpecimens(today.greeting.en, stateSpecimens())}>
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
          posterImg={posterImg(today.heroScene.poster, HERO_POSTER_SIZES, { style: HERO_POSTER_STYLE })}
        />
        <KpiCards september={today.september} />
        <TrucksTable trucks={trucksTableView(today.trucks)} />
      </main>
    </StateSwitch>
  );
}
