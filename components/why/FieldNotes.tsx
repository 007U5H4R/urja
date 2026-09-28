import type { Quote } from "@/content/field-notes";

/**
 * Chapter 01's quotes (final/why.html lines 169–174). With no field quotes yet,
 * the hatched placeholder card and the ASSUMPTION line stand in; none is invented.
 */
export function FieldNotes({ quotes }: { quotes: readonly Quote[] }) {
  if (quotes.length === 0) {
    return (
      <>
        <figure className="quote">
          <span className="chip wait">Placeholder</span>
          <blockquote>
            <p>[Field quote 1 — from conversations by 1 Oct]</p>
          </blockquote>
          <figcaption>[Role, fleet size, city]</figcaption>
        </figure>
        <p className="assume">
          <b>ASSUMPTION:</b> quotes are placeholders until the field conversations happen. None will be invented.
        </p>
      </>
    );
  }
  return (
    <>
      {quotes.map((q, i) => (
        // Position plus text: stable for this static list, and unique even if a quote repeats.
        <figure className="quote" key={`${i}:${q.text}`}>
          <blockquote>
            <p>{q.text}</p>
          </blockquote>
          <figcaption>{`${q.role}, ${q.fleetSize}, ${q.city}`}</figcaption>
        </figure>
      ))}
    </>
  );
}
