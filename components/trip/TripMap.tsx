"use client";

import "@/components/map/map.css";

import { useEffect, useRef, useState } from "react";

import type { TripMapHandle } from "@/components/map/map-client";
import { MAP_UNAVAILABLE } from "@/components/map/map-copy";
import { Icon } from "@/components/ui/Icon";
import type { TripMapView } from "@/lib/data/views/trip-map";

type MapStatus = "loading" | "ready" | "failed";

/**
 * The trip route map (a port of map.js `tripMap()`), rendered into
 * final/trip.html's `.map#tripMap` box: the plan dashed, the actual route
 * solid, the flagged spot lit; R4's extra-km segment lit. The box carries the
 * map in words (an aria-label on a group, TC-031). MapLibre arrives through `import()`
 * after hydration (TC-055); if it can't load, the overlay says so and the
 * timeline below still has every event.
 */
export function TripMap({ route }: { route: TripMapView }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    // A fresh container per mount, so a StrictMode remount never reuses the first map's element.
    const el = document.createElement("div");
    box.appendChild(el);
    let live = true;
    let h: TripMapHandle | null = null;
    const { plan, actual, lit, focus, events, bounds } = route;
    import("@/components/map/map-client")
      .then((m) =>
        m.mountTripMap(
          el,
          { plan, actual, lit, focus, events, bounds },
          { onFail: () => live && setStatus("failed"), onReady: () => live && setStatus("ready") },
        ),
      )
      .then((x) => {
        if (!live) return x.destroy();
        h = x;
      })
      .catch(() => live && setStatus("failed"));
    return () => {
      live = false;
      h?.destroy();
      el.remove();
    };
  }, [route]);

  return (
    <>
      {/* role="group": the box holds MapLibre's focusable canvas and the attribution links, which an img would hide. */}
      <div className="map" id="tripMap" ref={ref} role="group" aria-label={route.ariaLabel} data-map={status}></div>
      {status === "failed" && (
        <p className="glass map-fail">
          <Icon name="pin" />
          {MAP_UNAVAILABLE}
        </p>
      )}
    </>
  );
}

/** final/trip.html's full-screen button for the route card. */
export function FullscreenButton({ targetId }: { targetId: string }) {
  const toggle = () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };
  return (
    <button type="button" className="iconbtn" id="fs" aria-label="Full screen map" onClick={toggle}>
      <Icon name="expand" />
    </button>
  );
}
