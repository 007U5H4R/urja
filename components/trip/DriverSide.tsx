"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { DriverSideView, DriverView } from "@/lib/data/views/trip";

type Choice = "none" | "asked" | "explained";

/**
 * final/trip.html lines 63–76: the driver row and the driver's side.
 * Honest prototype actions (technical-plan §5.5): the buttons only change
 * this page's state and say plainly that nothing was sent. No request is made.
 */
export function DriverSide({ driver, side }: { driver: DriverView; side: DriverSideView | null }) {
  const [choice, setChoice] = useState<Choice>("none");
  const [noted, setNoted] = useState(false);
  const act = (c?: Choice) => {
    if (c) setChoice(c);
    setNoted(true);
  };
  const a = side?.actions ?? null;
  const chip =
    a && choice === "asked" ? { text: a.asked, tone: "wait" as const } : a && choice === "explained" ? { text: a.explained, tone: "wait" as const } : side?.chip;

  return (
    <div className="block" id="driver">
      <div className="drv">
        <span className="avatar" aria-hidden="true">
          {driver.initials}
        </span>
        <div>
          <b>{driver.name}</b>
          <small>{driver.since}</small>
        </div>
        <div className="acts">
          <button type="button" className="iconbtn" aria-label={driver.call} onClick={() => act()}>
            <Icon name="phone" />
          </button>
          <button type="button" className="iconbtn" aria-label={driver.message} onClick={() => act()}>
            <Icon name="chat" />
          </button>
        </div>
      </div>
      {side && chip && (
        <>
          <p className="label">Driver’s side</p>
          <StatusChip tone={chip.tone}>{chip.text}</StatusChip>
          {side.quote && (
            <p className="why">
              <b>{side.quote.who}</b> {side.quote.text}
            </p>
          )}
          {a && (
            <div className="actions">
              <button type="button" className="btn btn-lamp" aria-pressed={choice === "asked"} onClick={() => act("asked")}>
                <Icon name="chat" />
                {a.ask}
              </button>
              <button type="button" className="btn btn-line" aria-pressed={choice === "explained"} onClick={() => act("explained")}>
                {a.explain}
              </button>
            </div>
          )}
          {side.message && <p className="fine">{side.message}</p>}
        </>
      )}
      <p className="fine" role="status" data-testid="prototype-note">
        {noted ? (chip ? `${chip.text}. ${driver.note}` : driver.note) : ""}
      </p>
    </div>
  );
}
