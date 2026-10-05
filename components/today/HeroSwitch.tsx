/** The hero's three views (Design.md §14). */
export type HeroView = "scene" | "map" | "fleet";

/** final/index.html line 66: the mockup's `data-mode` values, kept verbatim. */
const MODES: { view: HeroView; mode: string; label: string }[] = [
  { view: "scene", mode: "scene", label: "Scene" },
  { view: "map", mode: "flags", label: "Map" },
  { view: "fleet", mode: "fleet", label: "Fleet" },
];

/** The Scene | Map | Fleet switch: three toggle buttons in a `.seg` group. */
export function HeroSwitch({ view, onChange }: { view: HeroView; onChange: (v: HeroView) => void }) {
  return (
    <div className="seg" role="group" aria-label="View">
      {MODES.map((m) => (
        <button key={m.view} type="button" data-mode={m.mode} aria-pressed={view === m.view} onClick={() => onChange(m.view)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}
