import type { ReactNode } from "react";

/** A "Simulated" chip (lamp.css `.chip`, dot + word): marks a stream or figure that is simulated in the prototype. */
export function SimulatedTag({ children = "Simulated" }: { children?: ReactNode }) {
  return <span className="chip wait bet-sim">{children}</span>;
}
