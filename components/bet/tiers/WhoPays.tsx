import { ClaimList } from "@/components/bet/ClaimList";
import type { Claim } from "@/content/bet/sources";
import type { TiersView, WhoPaysRow } from "@/lib/bet/views/tiers";
import { KeepRanges } from "./KeepRanges";

export interface WhoPaysProps {
  rows: readonly WhoPaysRow[];
  steps: TiersView["subsidySteps"];
  /** The steps in one sentence. */
  subsidy: string;
  subsidyClaims: readonly Claim[];
  /** The page's numbered source list. */
  order: readonly string[];
}

/**
 * Who pays (bet-spec §7): owners pay for the paid tiers, lending partners pay for Free through
 * referral fees, and the consent basis, our design and labelled an assumption, sits under both.
 * Then one referral fee, worked: loan → fee → years of Free.
 */
export function WhoPays({ rows, steps, subsidy, subsidyClaims, order }: WhoPaysProps) {
  return (
    <section className="panel bet-sec" aria-labelledby="who-h">
      <div className="sec-head">
        <h2 id="who-h">Who pays</h2>
      </div>
      <div className="wp-grid">
        {rows.map((r) => {
          const id = `wp-${r.payer.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <article key={r.payer} className="wp-card" aria-labelledby={id}>
              <h3 id={id}>{r.payer}</h3>
              <p className="wp-pays">
                <KeepRanges text={r.pays} />
              </p>
              {r.funds && (
                <p className="wp-funds">
                  Funds <strong>{r.funds}</strong>
                </p>
              )}
              <ClaimList claims={r.claims} order={order} className="wp-claims" />
            </article>
          );
        })}
      </div>

      <div className="wp-subsidy">
        <h3 id="wp-steps-h">What one referral fee buys</h3>
        <ol className="wp-steps" aria-labelledby="wp-steps-h">
          {steps.map((s) => (
            <li key={s.label}>
              <span className="ws-value">
                <KeepRanges text={s.value} />
              </span>
              <span className="ws-label">
                <KeepRanges text={s.label} />
              </span>
            </li>
          ))}
        </ol>
        <p className="wp-sentence">
          <KeepRanges text={subsidy} />
        </p>
        <ClaimList claims={subsidyClaims} order={order} className="wp-claims" />
      </div>
    </section>
  );
}
