import { SimulatedTag } from "@/components/bet/SimulatedTag";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import type { TruckHeadline, TruckView } from "@/lib/bet/views/truck";

/**
 * The lender view's headline: the truck's September from the ledger (its trucks() row, so
 * "Unaccounted" matches Today; flagged totals, which include flags later marked wrong, appear only
 * where they are labelled "Flagged"), in the bet's figure style.
 */
export function TruckFigures({ headline: h, resolution }: { headline: TruckHeadline; resolution: TruckView["resolution"] }) {
  const c = TRUCK_COPY.figures;
  return (
    <section className="panel bet-sec" aria-labelledby="tk-figures-h">
      <div className="sec-head">
        <h2 id="tk-figures-h">{c.h2}</h2>
        <span className="count">{h.text.trips}</span>
        <span className="right">
          <SimulatedTag />
        </span>
      </div>
      <dl className="bet-figures tk-figures">
        <div>
          <dt>{c.profit}</dt>
          <dd>{h.text.profit}</dd>
        </div>
        <div>
          <dt>{c.perKm}</dt>
          <dd>{h.text.perKm}</dd>
        </div>
        <div>
          <dt>{c.km}</dt>
          <dd>{h.text.km}</dd>
        </div>
        <div>
          <dt>{c.unaccounted}</dt>
          <dd>{h.text.unaccounted}</dd>
        </div>
        <div>
          <dt>{c.recovered}</dt>
          <dd>{resolution.text.recovered}</dd>
        </div>
        <div>
          <dt>{c.rank}</dt>
          <dd>
            {h.rank}
            <small>
              {" "}
              {c.rankOf} {h.of}
            </small>
          </dd>
        </div>
      </dl>
    </section>
  );
}
