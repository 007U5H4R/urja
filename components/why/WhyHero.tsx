import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { posterImg } from "@/components/ui/poster-img";

/**
 * The hero (final/why.html lines 142–163): byline, the typographic statement,
 * the lede, the two CTAs (primary first) and the truck poster in its 16:9 slot.
 * The poster sits below the statement, but on a phone it is inside the first viewport (y≈610–820
 * at 412×823) and is the page's LCP element, so it is preloaded rather than lazy (M-004 perf; EXE17), as a
 * plain <img> from posterImg so the page ships no client image code (EXE18).
 */
export function WhyHero({ byline }: { byline: string }) {
  const poster = posterImg("/truck-scene.png", "(max-width: 1120px) 100vw, 1056px", { fetchPriority: "high" });
  return (
    <section className="w-hero" aria-labelledby="w-h1">
      <p className="kicker">{byline}</p>
      <h1 id="w-h1">
        Fleet owners learn where their money leaked at month end. <em className="lit">Urja tells them the next morning.</em>
      </h1>
      <p className="lede">
        Urja is an AI munshi for Indian truck owners. It reconciles every trip’s diesel, tolls and kilometres from data
        Bytebeam-class devices already send, and explains each rupee that doesn’t add up — in Hindi or English, on
        WhatsApp, with the driver’s side attached.
      </p>
      <div className="actions">
        <Link className="btn btn-lamp" href="/message">
          See the 7 AM brief
          <Icon name="right" />
        </Link>
        <Link className="btn btn-line" href="/trips">
          Open a flagged trip
        </Link>
      </div>
      <figure className="w-scene" aria-hidden="true">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="why-road" gradientUnits="userSpaceOnUse" x1="0" y1="900" x2="0" y2="576">
              <stop offset="0" style={{ stopColor: "oklch(0.21 0.007 60)", stopOpacity: 0.95 }} />
              <stop offset="1" style={{ stopColor: "oklch(0.16 0.005 60)", stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="why-fade" gradientUnits="userSpaceOnUse" x1="0" y1="900" x2="0" y2="576">
              <stop offset="0" style={{ stopColor: "oklch(0.705 0.166 53)", stopOpacity: 0.5 }} />
              <stop offset="1" style={{ stopColor: "oklch(0.705 0.166 53)", stopOpacity: 0 }} />
            </linearGradient>
            <pattern id="why-hatchG" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="1.2" height="10" style={{ fill: "oklch(1 0 0 / .035)" }} />
            </pattern>
          </defs>
          <rect x="0" y="576" width="1600" height="324" fill="url(#why-hatchG)" />
          <polygon points="520,900 1080,900 806,576 794,576" fill="url(#why-road)" />
          <path d="M520 900 794 576M1080 900 806 576" style={{ fill: "none", stroke: "url(#why-fade)", strokeWidth: 1.5 }} />
          <line x1="800" y1="900" x2="800" y2="584" style={{ stroke: "url(#why-fade)", strokeWidth: 3, strokeDasharray: "30 26" }} />
          <line x1="0" y1="576" x2="1600" y2="576" style={{ stroke: "oklch(0.705 0.166 53 / .40)", strokeWidth: 1.5 }} />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element -- the optimised poster, from posterImg */}
        <img alt="" {...poster} />
      </figure>
    </section>
  );
}
