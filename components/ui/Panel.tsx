import type { HTMLAttributes } from "react";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** The mockups use `article` for cards and `section` for page sections. */
  as?: "article" | "section" | "div" | "aside";
}

/** A real container (Design.md §12 surfaces allow-list): `<article class="panel …">`. */
export function Panel({ as: Tag = "article", className, ...rest }: PanelProps) {
  return <Tag className={className ? `panel ${className}` : "panel"} {...rest} />;
}
