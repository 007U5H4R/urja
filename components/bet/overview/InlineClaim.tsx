import { Cite } from "@/components/bet/Cite";
import { isCited, type Claim } from "@/content/bet/sources";

export interface InlineClaimProps {
  claim: Claim;
  /** The page's numbered source list. */
  order: readonly string[];
}

/** One claim inside running text: its [n] links if cited, or the Assumption tag and its basis. */
export function InlineClaim({ claim, order }: InlineClaimProps) {
  return (
    <>
      {claim.text}{" "}
      {isCited(claim) ? (
        <Cite ids={claim.sourceIds} order={order} />
      ) : (
        <span className="bet-assume">
          <span className="bet-assume-tag">Assumption</span> {claim.basis}
        </span>
      )}
    </>
  );
}
