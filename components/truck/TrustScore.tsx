import { Cite } from "@/components/bet/Cite";
import { ClaimList } from "@/components/bet/ClaimList";
import { StatusChip } from "@/components/ui/StatusChip";
import { isCited } from "@/content/bet/sources";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import type { TruckView } from "@/lib/bet/views/truck";

type Trust = TruckView["trust"];

/** A share of a scale as a CSS width, clamped to 0–100%. */
const width = (v: number, max: number) => `${max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0}%`;

/**
 * The trust score (bet-spec §8): the score as text, a provisional label, and an ARIA meter whose
 * value text says both, so nothing rests on the bar's colour. The five weighted factors follow as
 * a table whose points add up to the score. Each row gives the measurement in its own units
 * ("5.6% of diesel ₹") beside the 0–1 score it earns, so the score is never read as the measure. The
 * weights are one assumption with one basis, stated once under the table; the thresholds where the
 * leakage and stability scores reach zero follow as labelled claims, with the benchmark's citation.
 * On the phone the Weight and Score columns step aside: Points ("8.9 of 20") carries both.
 */
export function TrustScore({ trust, order }: { trust: Trust; order: readonly string[] }) {
  const c = TRUCK_COPY.trust;
  const bases = [...new Set(trust.factors.flatMap((f) => (isCited(f.claim) ? [] : [f.claim.basis])))];
  return (
    <section className="panel bet-sec tk-trust" aria-labelledby="tk-trust-h">
      <div className="sec-head">
        <h2 id="tk-trust-h">{c.h2}</h2>
      </div>
      <div className="tk-trust-grid">
        <div className="tk-score">
          <p className="tk-score-v">
            <span className="lit">{trust.scoreText}</span>
            <small>{c.outOf}</small>
          </p>
          <StatusChip tone="wait">{trust.label}</StatusChip>
          <div
            className="meter tk-meter"
            role="meter"
            aria-label={c.meterLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={trust.score}
            aria-valuetext={`${trust.scoreText} ${c.outOf}, ${trust.label}`}
          >
            <span className="val" style={{ width: width(trust.score, 100) }}></span>
          </div>
          <div className="meter-l" aria-hidden="true">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
          <p className="tk-fine">{c.lede}</p>
          <p className="tk-fine">{trust.note}</p>
        </div>
        <div className="tbl-scroll tk-factors" role="region" aria-label={c.tableLabel} tabIndex={0}>
          <table className="tbl">
            <caption className="sr">{c.tableLabel}</caption>
            <thead>
              <tr>
                <th scope="col">{c.cols.factor}</th>
                <th scope="col" className="r hide-sm">
                  {c.cols.weight}
                </th>
                <th scope="col" className="r">
                  {c.cols.measured}
                </th>
                <th scope="col" className="r hide-sm">
                  {c.cols.score}
                </th>
                <th scope="col" className="r">
                  {c.cols.points}
                </th>
              </tr>
            </thead>
            <tbody>
              {trust.factors.map((f) => (
                <tr key={f.id}>
                  <th scope="row" className="tk-factor">
                    <span className="tk-factor-l">{f.label}</span>
                    <small>{f.measure}</small>
                    {isCited(f.claim) && <Cite ids={f.claim.sourceIds} order={order} />}
                  </th>
                  <td className="r hide-sm">{f.weight}</td>
                  <td className="r tk-measured">{f.measureText}</td>
                  <td className="r hide-sm">{f.valueText}</td>
                  <td className="r tk-points">
                    <span className="minibar" aria-hidden="true">
                      <b style={{ width: width(f.points, f.weight) }}></b>
                    </span>
                    {f.pointsText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {bases.map((b) => (
        <p key={b} className="bet-assume tk-basis">
          <span className="bet-assume-tag">Assumption</span> {c.basisLabel}: {b}
        </p>
      ))}
      {trust.assumptions.length > 0 && (
        <div className="tk-claims" role="group" aria-labelledby="tk-thresholds-h">
          <h3 className="tk-h3" id="tk-thresholds-h">
            {c.assumptionsLabel}
          </h3>
          <ClaimList claims={trust.assumptions} order={order} />
        </div>
      )}
    </section>
  );
}
