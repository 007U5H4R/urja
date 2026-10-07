import { sourceById } from "@/content/bet/sources";

export interface CiteProps {
  /** The sources this claim cites. */
  ids: readonly string[];
  /** The page's numbered source list (what <Sources> renders): [n] is a source's place in it. */
  order: readonly string[];
}

/**
 * Inline citation, `[1][3]`, each linking to its entry in the page's <Sources> list (`#src-<id>`).
 * The link carries the source's title for a screen reader. While any cited source is unverified
 * (EXE41), an "unverified" badge follows. An id missing from `order` throws, so it fails the build.
 */
export function Cite({ ids, order }: CiteProps) {
  const cited = ids.map((id) => {
    const n = order.indexOf(id) + 1;
    if (n === 0) throw new Error(`Cite: source ${id} is not in this page's source list`);
    return { n, source: sourceById(id) };
  });
  const unverified = cited.some((c) => c.source.status === "unverified");
  return (
    <span className="cite">
      {cited.map(({ n, source }) => (
        <a key={source.id} className="cite-n" href={`#src-${source.id}`}>
          [{n}]<span className="sr">{`Source ${n}: ${source.title}`}</span>
        </a>
      ))}
      {unverified && <span className="cite-badge">unverified</span>}
    </span>
  );
}
