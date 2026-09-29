import type { Metadata } from "next";
import Image from "next/image";
import { Money } from "@/components/ui/Money";
import { Plate } from "@/components/ui/Plate";
import { getOgCard } from "@/lib/og";
import { FuelDrop } from "./FuelDrop";
import "./og-card.css";

/**
 * The 1200 × 630 link-preview card (og/index.html; technical-plan §9). scripts/render-og.ts
 * screenshots it into public/og.png. Not linked from the nav, not indexed, no top bar.
 */
export const metadata: Metadata = {
  title: "Link preview card",
  robots: { index: false, follow: false },
};

export default function OgCard() {
  const c = getOgCard();
  return (
    <main className="og" id="og">
      <div className="art">
        <Image src="/truck-scene.png" alt="" fill unoptimized loading="eager" sizes="768px" />
      </div>
      <div className="brand">
        <span className="mark">
          <svg viewBox="0 0 26 26" aria-hidden="true">
            <use href="#i-mark" />
          </svg>
        </span>
        {c.brand}
      </div>
      <h1>{c.headline}</h1>
      <div className="glass flag">
        <Plate plate={c.plate} />
        <p className="what">{c.what}</p>
        <FuelDrop series={c.fuel} label={c.chartLabel} />
        <Money as="p" className="amt" inr={c.inr} lit="loss" />
      </div>
      <p className="foot">{c.foot}</p>
    </main>
  );
}
