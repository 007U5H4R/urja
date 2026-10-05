import { Money } from "@/components/ui/Money";
import type { RouteNormalView, TripLedgerView } from "@/lib/data/views/trip";
import { RouteNormalChart } from "./RouteNormalChart";

const ROW_CLASS = { row: "row", unaccounted: "row indent loss", total: "row total" } as const;

/** final/trip.html lines 116–129: freight − diesel − tolls − allowance − other = profit, then the route chart. */
export function TripLedger({ ledger, normal }: { ledger: TripLedgerView; normal: RouteNormalView }) {
  return (
    <article className="panel lpanel ledgerp" aria-labelledby="led-h">
      <div className="sec-head">
        <h2 id="led-h">Trip ledger</h2>
      </div>
      {ledger.rows.map((r) => (
        <div key={r.label} className={ROW_CLASS[r.kind]}>
          <span>{r.label}</span>
          <Money inr={r.inr} lit={r.kind === "total"} />
        </div>
      ))}
      {ledger.kind === "live" && <p className="note">{ledger.note}</p>}
      <RouteNormalChart normal={normal} />
    </article>
  );
}
