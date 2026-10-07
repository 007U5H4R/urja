import type { ReactNode } from "react";
import { ClaimList } from "@/components/bet/ClaimList";
import { SimulatedTag } from "@/components/bet/SimulatedTag";
import type { TierRowView, TiersView } from "@/lib/bet/views/tiers";
import { KeepRanges } from "./KeepRanges";

export interface TierTableProps {
  rows: readonly TierRowView[];
  hardware: TiersView["hardware"];
  /** The caption and the row labels. */
  table: TiersView["table"];
  /** The page's numbered source list. */
  order: readonly string[];
}

type RowKey = keyof TiersView["table"]["rowLabels"];

/** "—" for a field the view leaves empty (Free has no margin % and no share of recovered ₹). */
function orNone(text: string): ReactNode {
  return text ? (
    text
  ) : (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr">None</span>
    </>
  );
}

/** Each row's cell for one tier; the row order and labels come from the view. */
const CELLS: Record<RowKey, (r: TierRowView) => ReactNode> = {
  price: (r) => (
    <>
      <span className="tt-price">{r.price}</span>
      <span className="tt-unit">{r.unit}</span>
    </>
  ),
  adds: (r) => (
    <>
      <span className="tt-adds">{r.levels}</span>
      <ul className="tt-features">
        {r.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </>
  ),
  autonomy: (r) => <span className="tt-level">{r.autonomy}</span>,
  cost: (r) => r.cost,
  margin: (r) => (
    <>
      <span className={r.marginPct ? "tt-margin" : "tt-margin tt-neg"}>{r.margin}</span>
      {r.marginPct && <span className="tt-unit">{r.marginPct}</span>}
    </>
  ),
  shareOfRecovered: (r) => orNone(r.shareOfRecoveredText),
  vsWtp: (r) => <KeepRanges text={r.vsWtp} />,
  vsFleetx: (r) => <KeepRanges text={r.vsFleetx} />,
  paidBy: (r) => r.paidByText,
  priceBasis: (r) => <span className="bet-assume-tag">{r.priceStatus}</span>,
};

/**
 * The four tiers side by side (bet-spec §7): a real table, tiers as columns and attributes as
 * rows, in a focusable region that scrolls sideways where the page is too narrow (WCAG 1.4.10).
 */
export function TierTable({ rows, hardware, table, order }: TierTableProps) {
  const keys = Object.keys(table.rowLabels) as RowKey[];
  return (
    <section className="panel bet-sec bet-tiers-sec" aria-labelledby="tiers-h">
      <div className="sec-head">
        <h2 id="tiers-h">The four tiers</h2>
        <span className="count">{rows[0]?.unit}</span>
      </div>
      <p id="tiers-hint" className="sr">
        On a narrow screen the table scrolls sideways.
      </p>
      <div className="tbl-scroll bet-tier-scroll" role="region" aria-label="Tier table" aria-describedby="tiers-hint" tabIndex={0}>
        <table className="tbl bet-tier-table">
          <caption className="sr">{table.caption}</caption>
          <thead>
            <tr>
              <td className="tt-corner" />
              {rows.map((r) => (
                <th key={r.id} scope="col" className={`tt-name tt-${r.id}`}>
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k}>
                <th scope="row">
                  <span className="tt-rowlabel">{table.rowLabels[k]}</span>
                  {k === table.simulatedRow && <SimulatedTag />}
                </th>
                {rows.map((r) => (
                  <td key={r.id}>{CELLS[k](r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bet-tier-hw">
        <ClaimList claims={[hardware.design, hardware.line, hardware.today]} order={order} />
      </div>
    </section>
  );
}
