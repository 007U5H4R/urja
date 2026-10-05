import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import type { TodayHead } from "@/lib/data/views/today";

export type PageHeadProps = Pick<TodayHead, "greeting" | "verdict" | "tags">;

/** Today's greeting, verdict and day tags (final/index.html, section.pagehead). */
export function PageHead({ greeting, verdict, tags }: PageHeadProps) {
  return (
    <section className="pagehead" aria-labelledby="h1">
      <div>
        <p className="greet">{greeting.en}</p>
        <h1 className="verdict" id="h1">
          Your trucks earned <Money as="b" inr={verdict.earnedInr} /> yesterday.{" "}
          <Money inr={verdict.unaccountedInr} lit="loss" /> of it doesn’t add up, across {verdict.flaggedTrips}
          {/* a no-break space, as in the mockup's "3&nbsp;trips" */}
          {" "}
          {verdict.flaggedTrips === 1 ? "trip" : "trips"}.
        </h1>
      </div>
      <div className="controls">
        <span className="tag">
          <Icon name="calendar" />
          {tags.day}
        </span>
        <span className="tag">
          <Icon name="clock" />
          {tags.reconciled}
        </span>
      </div>
    </section>
  );
}
