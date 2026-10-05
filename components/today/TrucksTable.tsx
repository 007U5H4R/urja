"use client";

import { Fragment, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";
import { SectionHead } from "@/components/ui/SectionHead";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import type { TrucksTableRow, TrucksTableView } from "@/lib/data/views/today";

const KM = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const NOW_TONE: Record<TrucksTableRow["now"]["state"], StatusTone | undefined> = { moving: "moving", yard: undefined, workshop: "warn" };
const TONE_CLASS: Record<TrucksTableRow["tone"], string> = { top: " top", mid: "", low: " low" };
const UNACCOUNTED_CLASS: Record<TrucksTableRow["unaccountedTone"], string> = { subtle: "r subtle", plain: "r", loss: "r loss" };

function Row({ r }: { r: TrucksTableRow }) {
  const tone = TONE_CLASS[r.tone];
  return (
    <tr>
      <td>
        <span className={`rk${tone}`}>{r.rank}</span>
      </td>
      <td>
        <Plate plate={r.plate} />
      </td>
      <td className="hide-sm">{r.driver}</td>
      <td className="r hide-sm">{KM.format(r.km)}</td>
      <td className={r.tone === "top" ? "r lit" : "r"}>{r.perKmText}</td>
      <td className="hide-sm hide-md">
        <span className={`minibar${tone}`}>
          <b style={{ width: `${r.barPct}%` }}></b>
        </span>
      </td>
      <Money as="td" className={UNACCOUNTED_CLASS[r.unaccountedTone]} inr={r.unaccountedInr} />
      <td className="hide-sm">
        <StatusChip tone={NOW_TONE[r.now.state]}>{r.now.label}</StatusChip>
      </td>
    </tr>
  );
}

/**
 * "Trucks by profit per km" (final/index.html lines 137–155): ranks 1–5, a gap
 * row summing up the middle, and the bottom 3. "All N trucks" expands the table
 * in place (a real button with aria-expanded, not <details>) and collapses it back.
 * Narrow screens drop the low-value columns: Driver, Km, the bar and Now at ≤ 760 px (hide-sm),
 * the bar at 761–900 px (hide-md), as Design.md §16's "reduced truck table".
 */
export function TrucksTable({ trucks }: { trucks: TrucksTableView }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? trucks.rows : trucks.rows.filter((r) => !r.hidden);
  const showGap = !expanded && trucks.gapText != null;

  return (
    <section className="sec" id="trucks" aria-labelledby="trucks-h" style={{ padding: "28px 0 72px" }}>
      <article className="panel tablecard">
        <SectionHead
          id="trucks-h"
          title="Trucks by profit per km"
          count={trucks.period}
          right={
            <button
              type="button"
              className="btn btn-quiet"
              aria-expanded={expanded}
              aria-controls="trucks-rows"
              onClick={() => setExpanded((x) => !x)}
            >
              All {trucks.rows.length} trucks
              <Icon name="right" />
            </button>
          }
        />
        {/* DES-3 (WCAG 1.4.10): the table fits at every width it can (hide-sm, hide-md), and this
            focusable region scrolls it where it can't (320 px, 200% text), so no column is cut off. */}
        <div className="tbl-scroll" role="region" tabIndex={0} aria-labelledby="trucks-h">
          <table className="tbl" aria-labelledby="trucks-h">
            <thead>
              <tr>
                <th className="rank">
                  <span aria-hidden="true">#</span>
                  <span className="sr">Rank</span>
                </th>
                <th>Truck</th>
                <th className="hide-sm">Driver</th>
                <th className="r hide-sm">Km</th>
                <th className="r">₹ / km</th>
                <th className="hide-sm hide-md">
                  <span className="sr">Compared with the best</span>
                </th>
                <th className="r">Unaccounted</th>
                <th className="hide-sm">Now</th>
              </tr>
            </thead>
            <tbody id="trucks-rows">
              {rows.map((r) => (
                <Fragment key={r.plate}>
                  <Row r={r} />
                  {showGap && r.rank === trucks.gapAfterRank && (
                    <tr className="gap">
                      <td colSpan={8}>{trucks.gapText}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
