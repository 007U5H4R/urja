/** A number plate: `<span class="plate">RJ14 GB 4521</span>` (final/index.html); `lg` on the trip head. */
export function Plate({ plate, size, className }: { plate: string; size?: "lg"; className?: string }) {
  const cls = ["plate", size, className].filter(Boolean).join(" ");
  return <span className={cls}>{plate}</span>;
}
