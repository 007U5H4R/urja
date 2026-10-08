import type { ReactNode } from "react";
import { sectionTitle, type OverviewSectionId } from "@/content/bet/overview";

export interface OvSectionProps {
  id: OverviewSectionId;
  /** A short line under the heading. */
  lede?: string;
  /** Right of the heading, small: a count or a unit. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** One section of a bet tab page: a panel named by its h2, with an anchor (`#ov-<id>`). */
export function OvSection({ id, lede, aside, className, children }: OvSectionProps) {
  const h = `ov-${id}-h`;
  return (
    <section className={`panel bet-sec ov-sec${className ? ` ${className}` : ""}`} id={`ov-${id}`} aria-labelledby={h}>
      <div className="sec-head">
        <h2 id={h}>{sectionTitle(id)}</h2>
        {aside && <span className="count">{aside}</span>}
      </div>
      {lede && <p className="ov-lede">{lede}</p>}
      {children}
    </section>
  );
}
