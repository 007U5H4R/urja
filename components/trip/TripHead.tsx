import { Plate } from "@/components/ui/Plate";
import { formatINR } from "@/lib/format";
import type { TripHeadView } from "@/lib/data/views/trip";

/** final/trip.html lines 34–43: plate, route h1, meta, and the profit against the route's normal. */
export function TripHead({ head }: { head: TripHeadView }) {
  const r = head.result;
  return (
    <section className="triphead">
      <div>
        <div className="title">
          <Plate plate={head.plate} size="lg" />
          <h1>{head.route}</h1>
        </div>
        <p className="meta">{head.meta}</p>
      </div>
      <div className="result">
        {r.kind === "profit" ? (
          <>
            <p className="big">
              {formatINR(r.profitInr)}
              <small>profit</small>
            </p>
            <p className="vs">
              {r.vs.chip && <span className={`delta ${r.vs.chip.tone}`}>{r.vs.chip.text}</span>}
              {r.vs.text}
            </p>
          </>
        ) : (
          <>
            <p className="big">{r.label}</p>
            <p className="vs">{r.note}</p>
          </>
        )}
      </div>
    </section>
  );
}
