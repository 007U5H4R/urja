import { ClaimList } from "@/components/bet/ClaimList";
import type { TiersView } from "@/lib/bet/views/tiers";

export interface CostTableProps {
  costs: TiersView["costs"];
  /** The page's numbered source list. */
  order: readonly string[];
}

/** Cost to serve one truck for a month (bet-spec §7): each line with its amount and its claims. */
export function CostTable({ costs, order }: CostTableProps) {
  return (
    <section className="panel bet-sec" aria-labelledby="cost-h">
      <div className="sec-head">
        <h2 id="cost-h">Cost to serve one truck</h2>
        <span className="count">{costs.total}</span>
      </div>
      {/* Explicit roles: under 560 px the rows stack (tiers.css), and a table whose display
          changes can lose its table semantics in some browsers; the roles keep them. */}
      <table className="tbl bet-cost-table" role="table">
        <caption className="sr">Cost to serve one truck for a month, line by line</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              Line
            </th>
            <th scope="col" role="columnheader" className="r">
              Per month
            </th>
            <th scope="col" role="columnheader">
              Basis
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {costs.rows.map((r) => (
            <tr key={r.id} role="row">
              <th scope="row" role="rowheader">
                {r.label}
              </th>
              <td role="cell" className="r ct-amount">
                {r.amount}
              </td>
              <td role="cell" className="ct-basis">
                <ClaimList claims={r.claims} order={order} className="ct-claims" />
              </td>
            </tr>
          ))}
          <tr role="row" className="ct-total">
            <th scope="row" role="rowheader">
              Total
            </th>
            <td role="cell" className="r ct-amount">
              {costs.total}
            </td>
            <td role="cell" className="ct-basis" />
          </tr>
        </tbody>
      </table>
    </section>
  );
}
