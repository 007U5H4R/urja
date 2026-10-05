import type { ReactNode } from "react";

export interface SectionHeadProps {
  title: ReactNode;
  /** The h2's id, for the panel's `aria-labelledby`. */
  id?: string;
  count?: ReactNode;
  right?: ReactNode;
  /** Extra class on the right slot, e.g. `legend` on the trip fuel chart. */
  rightClassName?: string;
  /** Hide a decorative right slot (a legend) from assistive tech. */
  rightHidden?: boolean;
}

/** `<div class="sec-head"><h2>…</h2><span class="count">…</span><span class="right">…</span></div>`. */
export function SectionHead({ title, id, count, right, rightClassName, rightHidden }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <h2 id={id}>{title}</h2>
      {count != null && <span className="count">{count}</span>}
      {right != null && (
        <span
          className={rightClassName ? `right ${rightClassName}` : "right"}
          aria-hidden={rightHidden ? true : undefined}
        >
          {right}
        </span>
      )}
    </div>
  );
}
