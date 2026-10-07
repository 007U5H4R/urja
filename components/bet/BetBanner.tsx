import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * The banner's words (TASK-29). English only (EXE39); no amounts. No "→" either: on /why that glyph
 * would pull in the extra Inter arrows face, and e2e/perf.spec.ts holds /why to the core and ₹ faces.
 */
export const BET_BANNER = {
  tag: "New",
  text: "The SuprFleet bet: from Munshi to credit.",
  cta: "See the bet",
  href: "/bet",
} as const;

/**
 * The slim entry to the bet section (EXE37): one line of text and a link, on /why below the hero
 * and on the trip pages under the breadcrumbs; never on Today, the brief or the phone routes.
 * A server component with no image, so it can never become a page's LCP element.
 *
 * Styled with Tailwind utilities on the Lamplight tokens (the glue globals.css provides), not a CSS
 * file of its own: a module shared by /why and the trip pages would ship as a third stylesheet on
 * /why, which e2e/perf.spec.ts holds at two. `className` sets the spacing for each placement.
 */
export function BetBanner({ className = "mt-3" }: { className?: string }) {
  return (
    <p
      className={`bet-banner ${className} flex w-fit max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-line-soft bg-surface-1 py-1.5 pr-2 pl-1.5 text-[length:var(--t-sm)] leading-[1.4] text-fg-muted`}
    >
      {/* The spaces keep the words apart when the line is read or copied as text. */}
      <span className="bet-banner-tag inline-flex h-5 items-center rounded-[5px] bg-surface-2 px-[7px] text-[length:var(--t-xs)] font-[560] tracking-[.02em] text-cream shadow-[inset_2px_0_0_var(--lamp)]">
        {BET_BANNER.tag}
      </span>{" "}
      <span className="min-w-0 text-fg">{BET_BANNER.text}</span>{" "}
      {/* WCAG 2.5.8: the link is at least 24 px tall. */}
      <Link
        className="inline-flex min-h-6 items-center gap-1 rounded-sm px-1 font-[560] whitespace-nowrap text-lamp hover:bg-surface-2 hover:text-cream [&_svg.i]:size-3.5"
        href={BET_BANNER.href}
      >
        {BET_BANNER.cta}
        <Icon name="right" />
      </Link>
    </p>
  );
}
