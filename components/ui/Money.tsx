import { formatINR } from "@/lib/format";

const NOWRAP = { whiteSpace: "nowrap" } as const;

export type MoneyTone = "loss" | "gain";

export interface MoneyProps {
  /** Integer rupees from a view model. Negative = a cost, shown with U+2212. */
  inr: number;
  /** Colour class; always paired with words in the surrounding copy (Design.md §17). */
  tone?: MoneyTone;
  /** The focal amount: `true` → `lit`, `'loss'` → `lit-loss` (rule of light, Design.md §1). */
  lit?: boolean | "loss";
  /** `auto` (default): `−` on negatives only. `always` / `true`: also `+` on positives.
   *  `never` / `false`: no sign. */
  sign?: boolean | "auto" | "always" | "never";
  /** Extra mockup classes that come first, e.g. `amt`, `v`, `big`. */
  className?: string;
  as?: "span" | "b" | "p" | "dd" | "td" | "strong";
}

/** Rupees with en-IN grouping, as in the mockups: `<span class="amt loss">…</span>`. */
export function Money({ inr, tone, lit, sign: signProp = "auto", className, as: Tag = "span" }: MoneyProps) {
  const sign = signProp === true ? "always" : signProp === false ? "never" : signProp;
  const litClass = lit === "loss" ? "lit-loss" : lit ? "lit" : undefined;
  const cls = [className, tone, litClass].filter(Boolean).join(" ") || undefined;
  let text = formatINR(inr, { sign: sign === "never" ? "never" : "auto" });
  if (sign === "always" && Math.round(inr) > 0) text = `+${text}`;
  // DES-33: Unicode allows a line break between a sign and "₹" ("−", "+" and "₹" are all prefix
  // class PR), so a signed amount never wraps; unsigned ones can't break ("₹" before digits).
  const style = /^[−+]/.test(text) ? NOWRAP : undefined;
  return (
    <Tag className={cls} style={style}>
      {text}
    </Tag>
  );
}
