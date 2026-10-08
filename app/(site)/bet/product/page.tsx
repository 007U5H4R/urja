import type { Metadata } from "next";
import { Assumptions } from "@/components/bet/Assumptions";
import { BetHead } from "@/components/bet/BetHead";
import { BetTabs } from "@/components/bet/BetTabs";
import { Sources } from "@/components/bet/Sources";
import { Autonomy } from "@/components/bet/overview/Autonomy";
import { TenX } from "@/components/bet/overview/TenX";
import { BET_PRODUCT } from "@/content/bet/copy";
import { AUTONOMY, TENX, deferredAssumptions, productClaims } from "@/content/bet/overview";
import { citedSourceIds } from "@/content/bet/sources";
import { betProductMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/overview/overview.css";

// TASK-32 (EXE49): /bet/product: the 5–10x (bet-spec §3) and streams × autonomy (§6–§7), with the
// link to the flag lab on a real trip. productClaims() lists the page's claims for its <Sources>.
export const metadata: Metadata = betProductMetadata();

export default function BetProductPage() {
  const c = BET_PRODUCT;
  const claims = productClaims();
  const order = citedSourceIds(claims);
  return (
    <main className="wrap bet bet-overview" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <BetTabs path={c.path} />
      <TenX tenx={TENX} order={order} />
      <Autonomy autonomy={AUTONOMY} />
      <Assumptions claims={deferredAssumptions(claims)} order={order} />
      <Sources ids={order} />
    </main>
  );
}
