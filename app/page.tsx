import { EyesList } from "@/components/today/EyesList";
import { KpiCards } from "@/components/today/KpiCards";
import { LedgerBar } from "@/components/today/LedgerBar";
import { PageHead } from "@/components/today/PageHead";
import { TrucksTable } from "@/components/today/TrucksTable";
import { getToday, trucksTableView } from "@/lib/data/views/today";

/**
 * Today (final/index.html). A static server component: the view model is
 * built from the memoised dataset at build time. Phone order (Design.md §16):
 * verdict → ledger bar → needs your eyes → hero → September cards → trucks.
 */
export default function Today() {
  const today = getToday();
  return (
    <main className="wrap">
      <PageHead greeting={today.greeting} verdict={today.verdict} tags={today.tags} />
      <LedgerBar ledger={today.ledger} />
      <section className="hero-row">
        {/* TKT-10 fills this slot with the hero card (scene · map · fleet); it keeps the grid's first column. */}
        <div className="hero-slot" data-slot="hero" />
        <EyesList eyes={today.eyes} head={today.eyesHead} cleanLine={today.cleanLine} />
      </section>
      <KpiCards september={today.september} />
      <TrucksTable trucks={trucksTableView(today.trucks)} />
    </main>
  );
}
