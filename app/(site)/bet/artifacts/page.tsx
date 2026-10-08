import type { Metadata } from "next";
import { BetHead } from "@/components/bet/BetHead";
import { BetTabs } from "@/components/bet/BetTabs";
import { ArtifactCards } from "@/components/bet/artifacts/ArtifactCards";
import { ExternalLink } from "@/components/bet/artifacts/ExternalLink";
import { ARTIFACTS, ARTIFACTS_NOTE } from "@/content/bet/artifacts";
import { BET_ARTIFACTS } from "@/content/bet/copy";
import { betArtifactsMetadata } from "@/lib/metadata";
import "@/components/bet/bet.css";
import "@/components/bet/artifacts/artifacts.css";

// TASK-32 (EXE49): /bet/artifacts, the deliverables behind the prototype, one card each. The page
// states no research claim, so it has no Sources list; its note points to the research report.
export const metadata: Metadata = betArtifactsMetadata();

export default function BetArtifactsPage() {
  const c = BET_ARTIFACTS;
  const [before, after] = ARTIFACTS_NOTE.text.split(ARTIFACTS_NOTE.linkText);
  return (
    <main className="wrap bet bet-artifacts" id="main">
      <BetHead eyebrow={c.eyebrow} h1={c.h1} thesis={c.thesis} />
      <BetTabs path={c.path} />
      <ArtifactCards artifacts={ARTIFACTS} />
      <p className="bet-artifacts-note">
        {before}
        <ExternalLink href={ARTIFACTS_NOTE.href}>{ARTIFACTS_NOTE.linkText}</ExternalLink>
        {after}
      </p>
    </main>
  );
}
