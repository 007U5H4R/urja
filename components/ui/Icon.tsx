import type { IconName } from "./IconSprite";

export type { IconName };

/** `<svg class="i"><use href="#i-{name}"/></svg>`, as in the mockups. Decorative. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ? `i ${className}` : "i"} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
