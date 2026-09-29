import type { PlanPhase } from "@/content/why";

/** Chapter 06's first 90 days (final/why.html lines 242–246). */
export function Plan({ phases }: { phases: readonly PlanPhase[] }) {
  return (
    <ol className="plan">
      {phases.map((p) => (
        <li key={p.phase}>
          <p className="ph">{p.phase}</p>
          <p>{p.text}</p>
        </li>
      ))}
    </ol>
  );
}
