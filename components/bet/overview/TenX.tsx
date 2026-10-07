import { ClaimList } from "@/components/bet/ClaimList";
import type { TENX } from "@/content/bet/overview";
import { OvSection } from "./OvSection";

export interface TenXProps {
  tenx: typeof TENX;
  order: readonly string[];
}

/** bet-spec §3: one card per dimension, the multiple first, then today against Munshi. */
export function TenX({ tenx, order }: TenXProps) {
  return (
    <OvSection id="tenx" lede={tenx.lede}>
      <ul className="ov-tenx">
        {tenx.rows.map((r) => (
          <li key={r.id} className="ov-tenx-card">
            <h3 className="ov-kicker">{r.dimension}</h3>
            <p className="ov-tenx-multiple">{r.multiple}</p>
            <dl className="ov-tenx-vs">
              <div>
                <dt>{tenx.todayLabel}</dt>
                <dd>{r.today}</dd>
              </div>
              <div className="ov-tenx-munshi">
                <dt>{tenx.munshiLabel}</dt>
                <dd>{r.munshi}</dd>
              </div>
            </dl>
            {r.claims.length > 0 && <ClaimList claims={r.claims} order={order} className="ov-small" />}
          </li>
        ))}
      </ul>
    </OvSection>
  );
}
