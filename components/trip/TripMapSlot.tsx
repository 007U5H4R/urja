import { Rail } from "@/components/charts/Rail";
import type { RailView, TripMapSlotView } from "@/lib/data/views/trip";
import type { TripMapView } from "@/lib/data/views/trip-map";
import { FullscreenButton, TripMap } from "./TripMap";

/**
 * final/trip.html lines 79–89: the route card. `<TripMap/>` mounts the
 * MapLibre map inside `.map#tripMap` (lazily, client-side); the legend and the
 * tick rail carry the story while it loads or if it can't. Without a `route`
 * the box stays empty.
 */
export function TripMapSlot({ map, rail, route }: { map: TripMapSlotView; rail: RailView; route?: TripMapView | null }) {
  return (
    <article className="panel mapcard" id="mapcard" aria-labelledby="route-h">
      {route ? (
        <TripMap route={route} />
      ) : (
        <div className="map" id="tripMap" data-slot="trip-map" data-route={map.routeName}></div>
      )}
      <div className="fade"></div>
      <div className="mc-top">
        <h2 id="route-h">Route</h2>
        {route && (
          <div className="right">
            <FullscreenButton targetId="mapcard" />
          </div>
        )}
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
