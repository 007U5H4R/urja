import { Rail } from "@/components/charts/Rail";
import type { HeroFlag, HeroFleet } from "@/lib/data/views/today";

export type RailContent = { kind: "flag"; flag: HeroFlag } | { kind: "fleet"; fleet: HeroFleet };

/**
 * The glass rail box along the hero's foot (final/index.html `#rb`): the
 * selected trip's tick rail with its head and ends, or the fleet's "Now" line.
 * The rail is decorative: its head, ends and knob caption are visible text.
 */
export function RailBox({ content }: { content: RailContent }) {
  if (content.kind === "fleet") {
    return (
      <div className="glass railbox" id="rb">
        <div className="rb-head">
          <b>{content.fleet.railHead}</b>
          <span>{content.fleet.railNote}</span>
        </div>
      </div>
    );
  }
  const r = content.flag.rail;
  return (
    <div className="glass railbox" id="rb">
      <div className="rb-head">
        <b>{r.head}</b>
        <span>{r.sub}</span>
      </div>
      <Rail decorative uid="herorail" total={r.total} step={r.step} segs={r.segs} knob={r.knob} />
      <div className="rail-ends">
        <span>{r.ends[0]}</span>
        <span>{r.ends[1]}</span>
      </div>
    </div>
  );
}
