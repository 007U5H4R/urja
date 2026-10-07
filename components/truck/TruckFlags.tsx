import { Confidence } from "@/components/ui/Confidence";
import { Icon } from "@/components/ui/Icon";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import type { TruckFlagRow } from "@/lib/bet/views/truck";

/** The chip's bar colour; its text (the view's status words) carries the meaning. */
const STATUS_TONE: Record<TruckFlagRow["status"], StatusTone | undefined> = { waiting: "wait", confirmed: "ok", wrong: undefined };

/**
 * September's flags on this truck, oldest first. Each row gives the day, the rule, the confidence
 * (bars and word: "Check" when low), the driver's side and the status in words, and links to its
 * trip's evidence. A plain link, not next/link, so nothing is prefetched behind the reader's back.
 */
export function TruckFlags({ flags }: { flags: readonly TruckFlagRow[] }) {
  const c = TRUCK_COPY.flags;
  return (
    <section className="panel bet-sec tk-flagsec" aria-labelledby="tk-flags-h">
      <div className="sec-head">
        <h2 id="tk-flags-h">{c.h2}</h2>
        <span className="count">{flags.length}</span>
      </div>
      {flags.length === 0 ? (
        <p className="tk-lede">{c.empty}</p>
      ) : (
        <>
          <p className="tk-lede">{c.lede}</p>
          <ul className="tk-flaglist" aria-label={c.listLabel}>
            {flags.map((f) => (
              <li key={f.id} className="tk-flag">
                <span className="tk-flag-day">{f.dayLabel}</span>
                <span className="tk-flag-what">
                  <StatusChip tone="warn">{f.ruleName}</StatusChip>
                  <Confidence level={f.confidence} lang="en" />
                </span>
                <span className="tk-flag-amt">
                  <span>
                    <small>{c.flagged}</small> <b className="loss">{f.inrText}</b>
                  </span>
                  <span>
                    <small>{c.recovered}</small> <b>{f.recoveredText}</b>
                  </span>
                </span>
                <span className="tk-flag-state">
                  <StatusChip tone={STATUS_TONE[f.status]}>{f.statusText}</StatusChip>
                  <small>{f.driverSideText}</small>
                </span>
                <a className="tk-open" href={f.href}>
                  {c.open} {f.tripId}
                  <Icon name="right" />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
