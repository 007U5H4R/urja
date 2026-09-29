import { Fragment } from "react";
import type { Rich } from "@/lib/brief/template";

/** Template text with bold runs (the mockup's `<b>` inside data-hi strings). */
export function RichText({ text }: { text: Rich }) {
  return (
    <>
      {text.map((p, i) => (typeof p === "string" ? <Fragment key={i}>{p}</Fragment> : <b key={i}>{p.b}</b>))}
    </>
  );
}
