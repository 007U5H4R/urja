import Link from "next/link";
import { AskTrigger } from "./AskTrigger";
import { MobileMenu } from "./MobileMenu";
import { NavPills } from "./NavPills";
import { HideOnBarlessRoutes, RouteVariant } from "./RouteVariant";
import { SkipLink } from "./SkipLink";

type TopBarProps = { fleetName: string; truckCount: number };

/** "Sharma Roadlines" → "SR". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * The top bar on every route: a port of final/index.html lines 15–30. On /why
 * it follows final/why.html lines 125–137 instead: no Ask trigger or fleet
 * chip, and a "Start the demo" button before the menu. On the phone screens
 * (/brief, /message) it renders nothing: they carry their own bar and menu (EXE12).
 * Nor on /og-card, the link-preview card scripts/render-og.ts screenshots (§9).
 * A "Skip to content" link comes first in it (DES-32).
 */
export function TopBar({ fleetName, truckCount }: TopBarProps) {
  return (
    <HideOnBarlessRoutes>
      <header className="topbar">
        <SkipLink />
        <div className="wrap">
          <Link className="wordmark" href="/" aria-label="Urja, Today">
            <span className="mark">
              <svg viewBox="0 0 26 26" aria-hidden="true">
                <use href="#i-mark" />
              </svg>
            </span>
            Urja
          </Link>
          <RouteVariant why={null}>
            <AskTrigger />
          </RouteVariant>
          <NavPills />
          <div className="spacer"></div>
          <RouteVariant
            why={
              // /message has the phone screens' root layout (EXE23): a full page load, not prefetched.
              <Link className="btn btn-line" href="/message" prefetch={false}>
                Start the demo
              </Link>
            }
          >
            <span className="fleet">
              <span className="name">
                {fleetName} · {truckCount} trucks
              </span>
              <span className="avatar" aria-hidden="true">
                {initials(fleetName)}
              </span>
            </span>
          </RouteVariant>
          <MobileMenu />
        </div>
      </header>
    </HideOnBarlessRoutes>
  );
}
