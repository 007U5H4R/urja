import type { TimelineEvent } from "@/lib/data/views/trip";

/** final/trip.html lines 100–115: what happened, in order (dots: lamp = moves, green = checked, red = flag). */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <article className="panel lpanel" aria-labelledby="tl-h">
      <div className="sec-head">
        <h2 id="tl-h">What happened, in order</h2>
      </div>
      <ol className="timeline">
        {events.map((e, k) => (
          <li key={k} className={e.flag ? "flag" : undefined}>
            <span className="t">{e.t}</span>
            <span className={e.dot ? `dot ${e.dot}` : "dot"}></span>
            <span className="e">
              {e.text}
              {e.small && <small>{e.small}</small>}
            </span>
            <span className={e.vTone ? `v ${e.vTone}` : "v"}>{e.v ?? ""}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
