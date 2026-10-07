import { OVERVIEW_NAV_LABEL, OVERVIEW_SECTIONS } from "@/content/bet/overview";

/** Jump links to each section, so the page scans as a table of contents first. */
export function OverviewNav() {
  return (
    <nav className="ov-nav" aria-label={OVERVIEW_NAV_LABEL}>
      <ol>
        {OVERVIEW_SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#ov-${s.id}`}>{s.nav}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
