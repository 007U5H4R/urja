import { ClaimList } from "@/components/bet/ClaimList";
import { StatusChip } from "@/components/ui/StatusChip";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import type { MonthSlot, TruckView } from "@/lib/bet/views/truck";

/**
 * Verified days against the 180-day target, and the six month slots on the way (bet-spec §8).
 * September shows its verified days and surplus; a month not yet recorded shows its name and
 * "Not yet recorded" and nothing else: no number and no projection, ever. What counts as a verified
 * day, a verified truck-month and the 180-day target are our definitions, so they close the section
 * as labelled assumptions with their bases, followed by how this prototype applies them.
 */
export function VerifiedDays({ verified, months, order }: { verified: TruckView["verified"]; months: readonly MonthSlot[]; order: readonly string[] }) {
  const c = TRUCK_COPY.verified;
  const share = verified.target > 0 ? Math.min(1, verified.days / verified.target) : 0;
  return (
    <section className="panel bet-sec tk-verified" aria-labelledby="tk-verified-h">
      <div className="sec-head">
        <h2 id="tk-verified-h">{c.h2}</h2>
      </div>
      <p className="tk-big">{verified.text}</p>
      <div className="tk-progress" aria-hidden="true">
        <span style={{ width: `${share * 100}%` }}></span>
      </div>
      <p className="tk-lede">{c.lede}</p>
      <ol className="tk-months" aria-label={c.monthsLabel}>
        {months.map((m) =>
          m.state === "recorded" ? (
            <li key={m.label} className="tk-month is-recorded">
              <span className="tk-month-l">
                {m.label}
                <StatusChip tone="ok">{c.recorded}</StatusChip>
              </span>
              <span className="tk-month-v">
                {m.verifiedDays} <small>{c.days}</small>
              </span>
              {m.surplusText && (
                <span className="tk-month-v">
                  {m.surplusText} <small>{c.surplus}</small>
                </span>
              )}
              <span className="tk-month-n">{m.note}</span>
            </li>
          ) : (
            <li key={m.label} className="tk-month is-empty">
              <span className="tk-month-l">{m.label}</span>
              <span className="tk-month-n">{m.note}</span>
            </li>
          ),
        )}
      </ol>
      <div className="tk-def tk-claims" role="group" aria-labelledby="tk-def-h">
        <h3 className="tk-h3" id="tk-def-h">
          {c.definitionLabel}
        </h3>
        <ClaimList claims={verified.claims} order={order} />
        <p className="tk-fine">{verified.note}</p>
      </div>
    </section>
  );
}
