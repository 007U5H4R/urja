import Link from "next/link";
import { BetBanner } from "@/components/bet/BetBanner";
import { Icon } from "@/components/ui/Icon";
import type { Quote } from "@/content/field-notes";
import { BET_CHAPTER, COMPETITORS, FIRST_90_DAYS, METRICS, PIPELINE, type WhyView } from "@/content/why";
import { Chapter } from "./Chapter";
import { FieldNotes } from "./FieldNotes";
import { Market } from "./Market";
import { Metrics } from "./Metrics";
import { Pipeline } from "./Pipeline";
import { Plan } from "./Plan";
import { WhyHero } from "./WhyHero";

export interface WhyEssayProps {
  view: WhyView;
  quotes: readonly Quote[];
}

/**
 * Why Urja (final/why.html, main.essay): the owner’s day → owner → market gap → built on
 * Bytebeam → metric and guardrail → first 90 days → what's real (Design.md §25) → the bet (TASK-29).
 * The slim bet banner sits below the hero, never above it, so the hero keeps the LCP element (EXE37).
 */
export function WhyEssay({ view, quotes }: WhyEssayProps) {
  return (
    <main className="essay" id="main">
      <WhyHero byline={view.byline} />
      <BetBanner className="mt-8 md:mt-10" />

      <Chapter n="01" label="The owner’s day" title="I’m new to trucking. Here’s what owners commonly describe.">
        <div className="body">
          <FieldNotes quotes={quotes} />
          <p>
            What published research says, to be tested against the field: fuel is about 45–55% of a truck’s operating
            cost, and diesel leakage is often cited at about 8% of fuel filled (a soft figure; vendor blogs claim
            more). Those numbers are directional, not proven.
          </p>
        </div>
      </Chapter>

      <Chapter n="02" label="The owner" title="1 to 20 trucks, run from a phone.">
        <div className="body">
          <p>
            The owner doesn’t sit in a control room. They think in rupees per trip, live on WhatsApp, and often prefer
            Hindi. Today a munshi reconciles trips by hand from paper slips, days late. Every competitor built a
            dashboard for an enterprise fleet manager. Nobody built for this person. Bigger fleets describe the same pain,
            but the first segment is the owner with 1 to 20 trucks.
          </p>
        </div>
      </Chapter>

      <Chapter n="03" label="Why not another dashboard" title="The market has tools. The owner still finds out too late.">
        <Market rows={COMPETITORS} labelledBy="c3" />
      </Chapter>

      <Chapter
        n="04"
        label="Built on Bytebeam"
        title="Most of the stack already exists. The new part is the reconciliation."
      >
        <Pipeline nodes={PIPELINE} />
        <div className="body">
          <p>
            No new hardware: fuel level comes from the vehicle’s CAN bus, and FASTag records come from the toll
            statement.
          </p>
        </div>
      </Chapter>

      <Chapter
        n="05"
        label="How we’ll know"
        title="One metric that proves the promise, one guardrail for when it works too well."
      >
        <Metrics tiles={METRICS} />
      </Chapter>

      <Chapter n="06" label="First 90 days" title="What I’d do if I joined.">
        <Plan phases={FIRST_90_DAYS} />
      </Chapter>

      <Chapter n="07" label="About this prototype" title="What’s real here and what isn’t.">
        <div className="body">
          <p>
            {view.fleetName} is fictional, and its {view.truckCount} trucks and {view.tripDays} days of trips are
            simulated. That’s a little above the 1-to-20-truck owner in chapter 02; the rules check each trip the same
            way at any fleet size. The leakage rules really run on that data, every rupee on screen is computed, and Ask Urja is a
            live model answering only from it. Nothing here is a Bytebeam product.
          </p>
        </div>
      </Chapter>

      <Chapter n={BET_CHAPTER.n} label={BET_CHAPTER.label} title={BET_CHAPTER.title}>
        <div className="body">
          {BET_CHAPTER.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="bet-go">
          <Link className="btn btn-lamp" href={BET_CHAPTER.href}>
            {BET_CHAPTER.cta}
            <Icon name="right" />
          </Link>
          <p className="bet-more-lead" id="c8-more">
            {BET_CHAPTER.moreLabel}
          </p>
          <ul className="bet-more" aria-labelledby="c8-more">
            {BET_CHAPTER.more.map((m) => (
              <li key={m.href}>
                <Link href={m.href}>{m.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </Chapter>
    </main>
  );
}
