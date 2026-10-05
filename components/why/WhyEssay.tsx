import type { Quote } from "@/content/field-notes";
import { COMPETITORS, FIRST_90_DAYS, METRICS, PIPELINE, type WhyView } from "@/content/why";
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
 * Why Urja (final/why.html, main.essay): heard → owner → market gap → built on
 * Bytebeam → metric and guardrail → first 90 days → what's real (Design.md §25).
 */
export function WhyEssay({ view, quotes }: WhyEssayProps) {
  return (
    <main className="essay" id="main">
      <WhyHero byline={view.byline} />

      <Chapter n="01" label="What I heard" title="I’m new to trucking, so I went and asked.">
        <div className="body">
          <FieldNotes quotes={quotes} />
          <p>
            What vendor research says, to be tested against the field: fuel is 35–45% of a truck’s operating cost, and
            industry blogs claim 15–20% of fuel spend is lost to missing diesel or bill fraud. Those numbers are
            directional, not proven.
          </p>
        </div>
      </Chapter>

      <Chapter n="02" label="The owner" title="10 to 100 trucks, run from a phone.">
        <div className="body">
          <p>
            The owner doesn’t sit in a control room. They think in rupees per trip, live on WhatsApp, and often prefer
            Hindi. Today a munshi reconciles trips by hand from paper slips, days late. Every competitor built a
            dashboard for an enterprise fleet manager. Nobody built for this person.
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
            simulated. The leakage rules really run on that data, every rupee on screen is computed, and Ask Urja is a
            live model answering only from it. Nothing here is a Bytebeam product.
          </p>
        </div>
      </Chapter>
    </main>
  );
}
