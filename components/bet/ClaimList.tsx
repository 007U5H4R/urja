import { isCited, type Claim } from "@/content/bet/sources";
import { Cite } from "./Cite";

export interface ClaimListProps {
  claims: readonly Claim[];
  /** The page's numbered source list (see <Sources>). */
  order: readonly string[];
  className?: string;
  /**
   * TASK-32: show an assumption's tag but not its basis, which the page's <Assumptions> list
   * gives instead. Off by default: the basis follows the tag.
   */
  deferBasis?: boolean;
}

/** Claims as a list: a cited claim ends in its [n] links; an assumption says so and gives its basis. */
export function ClaimList({ claims, order, className, deferBasis = false }: ClaimListProps) {
  return (
    <ul className={className ? `bet-claims ${className}` : "bet-claims"}>
      {claims.map((c) => (
        <li key={c.text}>
          {c.text}{" "}
          {isCited(c) ? (
            <Cite ids={c.sourceIds} order={order} />
          ) : (
            <span className="bet-assume">
              <span className="bet-assume-tag">Assumption</span>
              {!deferBasis && ` ${c.basis}`}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
