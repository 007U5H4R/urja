import type { ReactNode } from "react";

export type StatusTone = "moving" | "ok" | "warn" | "wait";

/** Status chip: dot + text, never colour alone (lamp.css `.chip`). No tone = neutral. */
export function StatusChip({ tone, children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={tone ? `chip ${tone}` : "chip"}>{children}</span>;
}
