import Link from "next/link";
import { Rail } from "@/components/charts/Rail";
import { Money } from "@/components/ui/Money";
import type { CleanSpecimen, EmptySpecimen, ErrorSpecimen, LoadingSpecimen } from "@/lib/data/views/states";
import { StateCard } from "./StateCard";
import { TodaySkeleton } from "./Skeleton";
import { WorkingViewButton } from "./WorkingViewButton";

/* The four specimens of final/states.html (loading, empty, working: a clean day,
   error: data late), rendering the StateSpecimens view model only. */

/** Loading: the skeleton, and the only thing lit is the real progress. */
export function LoadingSpecimenCard({ s }: { s: LoadingSpecimen }) {
  return (
    <StateCard id="st-load" chip="Loading" tone="moving" tag={s.tag} tagIsHeading>
      <TodaySkeleton />
      <div className="progress">
        <p role="status">
          {s.status.lead}
          <b>{s.status.done}</b>
        </p>
        <Rail uid="st-load" extraClass="trips" label={s.rail.label} total={s.rail.total} step={s.rail.step} segs={s.rail.segs} />
      </div>
    </StateCard>
  );
}

/** Empty: no trips finished yesterday; where the trucks are, and when the next brief lands. */
export function EmptySpecimenCard({ s }: { s: EmptySpecimen }) {
  return (
    <StateCard id="st-empty" chip="Empty" tag={s.tag}>
      <h1 id="st-empty">{s.title}</h1>
      <p className="copy">{s.copy}</p>
      <div className="actions">
        <Link className="btn btn-line" href={s.fleet.href}>
          {s.fleet.text}
        </Link>
        <Link className="btn btn-quiet" href={s.september.href}>
          {s.september.text}
        </Link>
      </div>
    </StateCard>
  );
}

/** Working, a clean day: the peak gets the lamp. */
export function CleanSpecimenCard({ s }: { s: CleanSpecimen }) {
  return (
    <StateCard id="st-clean" chip="Working" tone="ok" tag={s.tag} className="clean">
      <h1 id="st-clean">
        {s.title.before}
        <Money inr={s.title.inr} lit />
        {s.title.after}
      </h1>
      <p className="copy">{s.copy.map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : p.text))}</p>
      <div className="trips">
        <Rail uid="st-clean" label={s.rail.label} total={s.rail.total} step={s.rail.step} segs={s.rail.segs} />
        <div className="rail-ends" aria-hidden="true">
          <span>{s.ends[0]}</span>
          <span>{s.ends[1]}</span>
        </div>
      </div>
      <div className="actions">
        <Link className="btn btn-line" href={s.ledger.href}>
          {s.ledger.text}
        </Link>
      </div>
    </StateCard>
  );
}

/**
 * Error, data late: what happened, that nothing is lost, and two visible ways on.
 * In the prototype the data is all here, so both lead to the working view.
 */
export function ErrorSpecimenCard({ s }: { s: ErrorSpecimen }) {
  return (
    <StateCard id="st-err" chip="Error" tone="wait" tag={s.tag} role="alert">
      <h1 id="st-err">{s.title}</h1>
      <p className="copy">{s.copy}</p>
      <div className="actions">
        <WorkingViewButton className="btn btn-lamp">{s.ready}</WorkingViewButton>
        <WorkingViewButton className="btn btn-line">{s.retry}</WorkingViewButton>
      </div>
    </StateCard>
  );
}
