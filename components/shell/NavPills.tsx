"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NAV_PILLS, isCurrent } from "./nav";

/** final/index.html lines 19–24. */
export function NavPills() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="navpills" aria-label="Main">
      {NAV_PILLS.map((p) => (
        <Link
          key={p.href}
          className="pill"
          aria-label={p.label}
          href={p.href}
          aria-current={isCurrent(p.href, pathname) ? "page" : undefined}
        >
          <Icon name={p.icon} />
          <span className="lbl">{p.label}</span>
        </Link>
      ))}
    </nav>
  );
}
