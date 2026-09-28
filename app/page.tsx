import { LedgerBar } from "@/components/today/LedgerBar";
import { PageHead } from "@/components/today/PageHead";
import { getTodayHead } from "@/lib/data/views/today";

/**
 * Today (final/index.html). A static server component: the view model is
 * built from the memoised dataset at build time.
 * TKT-04 adds the needs-your-eyes list, the September KPIs and the trucks
 * table below the ledger bar; TKT-10 adds the hero row.
 */
export default function Today() {
  const head = getTodayHead();
  return (
    <main className="wrap">
      <PageHead greeting={head.greeting} verdict={head.verdict} tags={head.tags} />
      <LedgerBar ledger={head.ledger} />
    </main>
  );
}
