import type { ReactNode } from "react";

export interface ChapterProps {
  /** "01" … "07"; also names the heading id (c1 … c7). */
  n: string;
  label: string;
  title: ReactNode;
  children: ReactNode;
}

/** One essay chapter (final/why.html): the numbered kicker, the glowing h2, then the body. */
export function Chapter({ n, label, title, children }: ChapterProps) {
  const id = `c${Number(n)}`;
  return (
    <section className="chap" aria-labelledby={id}>
      <p className="kicker">
        <b>{n}</b> · {label}
      </p>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
