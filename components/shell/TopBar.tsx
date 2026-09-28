import Link from "next/link";
import { AskTrigger } from "./AskTrigger";
import { MobileMenu } from "./MobileMenu";
import { NavPills } from "./NavPills";

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

/** The top bar on every route: a port of final/index.html lines 15–30. */
export function TopBar({ fleetName, truckCount }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link className="wordmark" href="/" aria-label="Urja, Today">
          <span className="mark">
            <svg viewBox="0 0 26 26" aria-hidden="true">
              <use href="#i-mark" />
            </svg>
          </span>
          Urja
        </Link>
        <AskTrigger />
        <NavPills />
        <div className="spacer"></div>
        <span className="fleet">
          <span className="name">
            {fleetName} · {truckCount} trucks
          </span>
          <span className="avatar" aria-hidden="true">
            {initials(fleetName)}
          </span>
        </span>
        <MobileMenu />
      </div>
    </header>
  );
}
