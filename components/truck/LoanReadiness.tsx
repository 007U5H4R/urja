import { ClaimList } from "@/components/bet/ClaimList";
import { StatusChip } from "@/components/ui/StatusChip";
import { PROTOTYPE_NOTE } from "@/content/bet/copy";
import { isCited, type Claim } from "@/content/bet/sources";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import type { TruckView } from "@/lib/bet/views/truck";
import { ShareAction } from "./ShareAction";

export interface LoanReadinessProps {
  loan: TruckView["loan"];
  /** BET_TRUCK's claims: the cited ones go under "Why a lender would care", any assumption under
   *  "Consent and partnership" with its label. */
  betClaims: readonly Claim[];
  order: readonly string[];
}

/**
 * Loan readiness (bet-spec §8), illustrative throughout: the lines from the verified days and what
 * they assume, then the consent step, the partnership and BET_TRUCK's own assumptions (ClaimList
 * labels each one), the share action, the rails the sources describe, and BET_TRUCK's cited claims
 * on why a lender would care. The view's consent line is shown once, with its label, under Consent
 * and partnership. components/truck/claims.ts lists these claims in the same order.
 */
export function LoanReadiness({ loan, betClaims, order }: LoanReadinessProps) {
  const c = TRUCK_COPY.loan;
  const lines = loan.lines.filter((l) => l !== loan.consent.text);
  const market = betClaims.filter(isCited);
  const betAssumptions = betClaims.filter((x) => !isCited(x));
  return (
    <section className="panel bet-sec tk-loan" aria-labelledby="tk-loan-h">
      <div className="sec-head">
        <h2 id="tk-loan-h">{c.h2}</h2>
        <span className="right">
          <StatusChip tone="wait">{c.tag}</StatusChip>
        </span>
      </div>
      <p className="tk-lede">{c.lede}</p>
      <div className="tk-loan-grid">
        <div>
          <h3 className="tk-h3" id="tk-lines-h">
            {c.linesLabel}
          </h3>
          <ul className="tk-lines" aria-labelledby="tk-lines-h">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <h3 className="tk-h3" id="tk-assume-h">
            {c.assumptionsLabel}
          </h3>
          <ClaimListLabelled labelledBy="tk-assume-h" claims={loan.assumptions} order={order} />
        </div>
        <div>
          <h3 className="tk-h3" id="tk-consent-h">
            {c.consentLabel}
          </h3>
          <ClaimListLabelled labelledBy="tk-consent-h" claims={[loan.consent, loan.partnership, ...betAssumptions]} order={order} />
          <ShareAction button={c.share.button} stepHead={c.share.stepHead} steps={c.share.steps} note={PROTOTYPE_NOTE} sent={c.share.sent} />
          <h3 className="tk-h3" id="tk-context-h">
            {c.contextLabel}
          </h3>
          <ClaimListLabelled labelledBy="tk-context-h" claims={loan.context} order={order} />
        </div>
      </div>
      {market.length > 0 && (
        <>
          <h3 className="tk-h3" id="tk-market-h">
            {c.marketLabel}
          </h3>
          <ClaimListLabelled labelledBy="tk-market-h" claims={market} order={order} />
        </>
      )}
    </section>
  );
}

/** ClaimList inside a group named by its heading, so each list has an accessible name. */
function ClaimListLabelled({ labelledBy, claims, order }: { labelledBy: string; claims: readonly Claim[]; order: readonly string[] }) {
  return (
    <div className="tk-claims" role="group" aria-labelledby={labelledBy}>
      <ClaimList claims={claims} order={order} />
    </div>
  );
}
