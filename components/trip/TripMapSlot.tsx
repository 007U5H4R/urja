import { Rail } from "@/components/charts/Rail";
import type { RailView, TripMapSlotView } from "@/lib/data/views/trip";

/**
 * final/trip.html lines 79–89: the route card. TKT-10 (TripMap) mounts the
 * MapLibre map inside `.map#tripMap`; until then the box stays empty and the
 * legend and the tick rail carry the story. No map code is imported here.
 */
export function TripMapSlot({ map, rail }: { map: TripMapSlotView; rail: RailView }) {
  return (
    <article className="panel mapcard" id="mapcard" aria-labelledby="route-h">
      {/* TKT-10: <TripMap/> renders into this box. */}
      <div className="map" id="tripMap" data-slot="trip-map" data-route={map.routeName}></div>
      <div className="fade"></div>
      <div className="mc-top">
        <h2 id="route-h">Route</h2>
      </div>
      <div className="glass maplegend" aria-hidden="true">
        {map.legend.map((l) => (
          <span key={l.text}>
            <i className={l.cls}></i>
            {l.text}
          </span>
        ))}
      </div>
      <div className="glass railbox">
        <div className="rb-head">
          <b>{rail.head}</b>
          <span>{rail.key}</span>
        </div>
        <Rail decorative uid="rail" total={rail.total} step={rail.step} segs={rail.segs} knob={rail.knob} />
        <div className="rail-ends">
          <span>{rail.ends[0]}</span>
          <span>{rail.ends[1]}</span>
        </div>
      </div>
    </article>
  );
}
