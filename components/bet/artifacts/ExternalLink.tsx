import type { ReactNode } from "react";
import { NEW_TAB_CUE } from "@/content/bet/artifacts";

export interface ExternalLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** A link that opens in a new tab: no opener, no referrer, an ↗ to see and a cue a screen reader says. */
export function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="ext-arrow" aria-hidden="true">
        {" ↗"}
      </span>
      <span className="sr">{` ${NEW_TAB_CUE}`}</span>
    </a>
  );
}
