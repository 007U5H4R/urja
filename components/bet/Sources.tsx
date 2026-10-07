import { StatusChip } from "@/components/ui/StatusChip";
import { sourceById } from "@/content/bet/sources";

export interface SourcesProps {
  /** The page's sources in citation order; <Cite> numbers against the same list. */
  ids: readonly string[];
}

/**
 * The numbered source list at the foot of a bet page. Each entry is the target of its [n]
 * links (`#src-<id>`) and states its status: Unverified until the verification pass opens the
 * page (EXE41), then Verified with the date it was read.
 */
export function Sources({ ids }: SourcesProps) {
  if (ids.length === 0) return null;
  const sources = ids.map(sourceById);
  return (
    <section className="panel bet-sources" aria-labelledby="bet-sources-h">
      <div className="sec-head">
        <h2 id="bet-sources-h">Sources</h2>
        <span className="count">{sources.length}</span>
      </div>
      <p className="bet-sources-note">
        Unverified sources were found through search results and have not yet been opened and quoted; treat their figures as leads.
      </p>
      <ol>
        {sources.map((s) => (
          <li key={s.id} id={`src-${s.id}`}>
            <a className="bet-src-title" href={s.url} rel="noreferrer">
              {s.title}
            </a>
            <span className="bet-src-meta">
              {s.publisher} · {s.date}
              {s.status === "verified" ? (
                <StatusChip tone="ok">{`Verified ${s.accessed ?? ""}`.trim()}</StatusChip>
              ) : (
                <StatusChip tone="wait">Unverified</StatusChip>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
