import type { Competitor } from "@/content/why";

/**
 * Chapter 03's comparison (final/why.html lines 191–202): a real table, named
 * by the chapter heading; the last column hides ≤860px. There, each gap shows as a muted second
 * line in its "does well" cell instead, so a phone keeps the chapter's argument (DES-27).
 */
export function Market({ rows, labelledBy }: { rows: readonly Competitor[]; labelledBy: string }) {
  return (
    <div className="panel cmpcard">
      <table className="cmp" aria-labelledby={labelledBy}>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr">Product</span>
            </th>
            <th scope="col">What it does well</th>
            <th scope="col" className="hide-sm">
              What the small-fleet owner still lacks
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className={r.us ? "us" : undefined}>
              <th scope="row">{r.name}</th>
              <td>
                {r.does}
                {r.lacks && (
                  <span className="lacks">
                    <span className="sr">What the small-fleet owner still lacks: </span>
                    {r.lacks}
                  </span>
                )}
              </td>
              <td className="hide-sm">
                {r.lacks ?? (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr">nothing missing</span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
