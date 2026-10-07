import { ClaimList } from "@/components/bet/ClaimList";
import {
  BOARD_COPY,
  BOARD_JOBS,
  BOARD_ROWS,
  BOARD_STATE_LABEL,
  type BoardCell,
  type DroppedCandidate,
} from "@/content/bet/board";
import type { BOARD_INTRO } from "@/content/bet/overview";
import { OvSection } from "./OvSection";

export interface BoardProps {
  intro: typeof BOARD_INTRO;
  copy: typeof BOARD_COPY;
  jobs: typeof BOARD_JOBS;
  rows: typeof BOARD_ROWS;
  dropped: readonly DroppedCandidate[];
  order: readonly string[];
}

function Cell({ cell }: { cell: BoardCell }) {
  if (cell.state === "open") return <td className="ov-cell">{cell.text}</td>;
  return (
    <td className={`ov-cell ov-cell-${cell.state}`}>
      <span className="ov-state">{BOARD_STATE_LABEL[cell.state]}</span>
      {cell.text && <span className="ov-cell-text">{cell.text}</span>}
    </td>
  );
}

/**
 * bet-spec §4: segments × jobs as a real table, in a focusable region that scrolls sideways on a
 * narrow screen (WCAG 1.4.10). A marked cell names its state in words; the light only repeats it.
 * Below it, the candidates we dropped and why.
 */
export function Board({ intro, copy, jobs, rows, dropped, order }: BoardProps) {
  return (
    <OvSection id="board" lede={intro.lede}>
      <ClaimList claims={[intro.segment]} order={order} className="ov-small ov-board-why" />
      {/* The caption names the table; this visible copy stays put while the table scrolls. */}
      <p className="ov-board-legend" aria-hidden="true">
        {copy.caption}
      </p>
      {/* Read as the region's description at every width; shown where the board scrolls. */}
      <p id="ov-board-hint" className="ov-board-hint">
        {copy.hint}
        <span aria-hidden="true"> →</span>
      </p>
      <div className="tbl-scroll ov-board-scroll" role="region" aria-label={copy.regionLabel} aria-describedby="ov-board-hint" tabIndex={0}>
        <table className="tbl ov-board">
          <caption className="sr">{copy.caption}</caption>
          <thead>
            <tr>
              <td className="ov-corner" />
              {jobs.map((j) => (
                <th key={j.id} scope="col">
                  {j.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">
                  <span className="ov-seg">{r.label}</span>
                  {r.note && <span className="ov-seg-note">{r.note}</span>}
                </th>
                {jobs.map((j) => (
                  <Cell key={j.id} cell={r.cells[j.id]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ClaimList claims={copy.claims} order={order} className="ov-small ov-board-note" />

      <div className="ov-dropped">
        <h3>{copy.droppedHeading}</h3>
        <ul className="ov-dropped-list">
          {dropped.map((d) => (
            <li key={d.id} className="ov-dropped-item">
              <h4>{d.name}</h4>
              <ClaimList claims={d.claims} order={order} className="ov-small" />
            </li>
          ))}
        </ul>
      </div>
    </OvSection>
  );
}
