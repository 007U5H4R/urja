import { Cite } from "@/components/bet/Cite";
import { isCited, type Claim } from "@/content/bet/sources";

export interface InlineClaimProps {
  claim: Claim;
  /** The page's numbered source list. */
  order: readonly string[];
  /** TASK-32: the tag only; the page's <Assumptions> list gives the basis. */
  deferBasis?: boolean;
}

/** One claim inside running text: its [n] links if cited, or the Assumption tag and its basis. */
export function InlineClaim({ claim, order, deferBasis = false }: InlineClaimProps) {
  return (
    <>
      {claim.text}{" "}
      {isCited(claim) ? (
        <Cite ids={claim.sourceIds} order={order} />
      ) : (
        <span className="bet-assume">
          <span className="bet-assume-tag">Assumption</span>
          {!deferBasis && ` ${claim.basis}`}
        </span>
      )}
    </>
  );
}
