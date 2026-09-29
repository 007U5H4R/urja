import type { ReactNode } from "react";

export type DeltaTone = "loss" | "gain" | "neutral";

/** Delta chip with a left accent bar (lamp.css `.delta`); `neutral` has no accent. */
export function DeltaChip({ tone, children }: { tone: DeltaTone; children: ReactNode }) {
  return <span className={tone === "neutral" ? "delta" : `delta ${tone}`}>{children}</span>;
}
