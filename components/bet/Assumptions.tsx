import type { Claim } from "@/content/bet/sources";
import { ClaimList } from "./ClaimList";

export interface AssumptionsProps {
  /** The assumptions whose bases the page's body leaves out (deferredAssumptions()). */
  claims: readonly Claim[];
  order: readonly string[];
}

/**
 * TASK-32 (EXE49): a bet page's assumptions with their bases, closed by default, so the body
 * reads short. Each claim in the body keeps its Assumption tag; nothing is deleted.
 */
export function Assumptions({ claims, order }: AssumptionsProps) {
  if (claims.length === 0) return null;
  return (
    <details className="panel bet-assumptions">
      <summary>
        <span className="bet-assumptions-title">Assumptions behind this page</span>
        <span className="count">{claims.length}</span>
      </summary>
      <ClaimList claims={claims} order={order} className="bet-assumptions-list" />
    </details>
  );
}
