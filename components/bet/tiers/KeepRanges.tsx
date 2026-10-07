import { Fragment } from "react";

/** A number range written with an en dash: "₹150–300", "₹5,000–15,000", "0.5–1.5%", "5–16". */
const RANGE = /(₹?\d[\d,.]*–\d[\d,.]*%?)/;

/**
 * `text` with each number range wrapped so it never breaks at its en dash ("₹150–" / "300").
 * Presentation only: the text is the view's string, unchanged.
 */
export function KeepRanges({ text }: { text: string }) {
  const parts = text.split(RANGE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="bet-nowrap">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
