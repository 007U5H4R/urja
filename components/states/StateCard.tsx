import type { ReactNode } from "react";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";

export interface StateCardProps {
  /** The heading id the section is labelled by. */
  id: string;
  /** The chip word: Loading, Empty, Working, Error. */
  chip: string;
  tone?: StatusTone;
  /** What the state is about, after the chip ('no trips finished yesterday'). */
  tag: string;
  /**
   * The tag is the card's heading when the state has no headline of its own
   * (loading); otherwise the headline is, and the tag is a plain line.
   */
  tagIsHeading?: boolean;
  className?: string;
  role?: "alert";
  children: ReactNode;
}

/**
 * One state card (final/states.html `section.panel.state`). On a live view the
 * card is the page's content, so its heading is the page's h1.
 */
export function StateCard({ id, chip, tone, tag, tagIsHeading, className, role, children }: StateCardProps) {
  const Tag = tagIsHeading ? "h1" : "p";
  return (
    <section
      className={["panel state wide", className].filter(Boolean).join(" ")}
      role={role}
      aria-labelledby={id}
    >
      <Tag className="st-tag" id={tagIsHeading ? id : undefined}>
        <StatusChip tone={tone}>{chip}</StatusChip>
        <span className="sr"> · </span>
        {tag}
      </Tag>
      {children}
    </section>
  );
}

/** A state view's frame: the greeting line, then the card (final/states.html `.st-head` + `.states`). */
export function StateView({ greet, children }: { greet: string; children: ReactNode }) {
  return (
    <main className="wrap st-view" id="main">
      <section className="st-head">
        <p className="greet">{greet}</p>
      </section>
      <div className="states">{children}</div>
    </main>
  );
}
