"use client";

import "@/components/map/map.css";
import "@/components/scene/scene.css";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { HeroMapData } from "@/components/map/hero-map";
import type { HeroMapHandle } from "@/components/map/map-client";
import { MAP_UNAVAILABLE } from "@/components/map/map-copy";
import { SceneBoundary } from "@/components/scene/SceneBoundary";
import type { SceneState } from "@/components/scene/TruckScene";
import { Icon } from "@/components/ui/Icon";
import type { CleanLine, EyeRow, EyesHead, HeroFlag, HeroFleet, HeroScene, MapCity } from "@/lib/data/views/today";
import { EyesList } from "./EyesList";
import { GlassCard } from "./GlassCard";
import { HeroSwitch, type HeroView } from "./HeroSwitch";
import { RailBox } from "./RailBox";

export interface HeroCardProps {
  hero: HeroFlag[];
  fleet: HeroFleet;
  scene: HeroScene;
  cities: MapCity[];
  eyes: EyeRow[];
  eyesHead: EyesHead;
  cleanLine: CleanLine;
}

type MapStatus = "off" | "loading" | "ready" | "failed";

// The live 3D scene (TKT-14): its wrapper loads after hydration and three.js after idle (TC-055).
const TruckScene = dynamic(() => import("@/components/scene/TruckScene"), { ssr: false });

/** Where a link or the URL points the hero: `?view=map|fleet`, `?flag=2`. */
function fromUrl(search: string, flags: number): { view: HeroView; selected: number } | null {
  const q = new URLSearchParams(search);
  const v = q.get("view");
  const n = Number(q.get("flag"));
  const selected = Number.isInteger(n) && n >= 1 && n <= flags ? n - 1 : 0;
  const view: HeroView | null = v === "map" || v === "fleet" ? v : selected > 0 ? "map" : null;
  return view ? { view, selected } : null;
}

/**
 * The Today hero row (final/index.html lines 55–102): the hero card with its
 * Scene | Map | Fleet switch, glass card and rail box, beside "Needs your eyes".
 *
 * Selection lives here, in React state, never in the map (technical-plan §8):
 * `selected` (0–2, eyes row n − 1) and `view`. Eyes rows and map markers call
 * `select`; flags 2 and 3 switch Scene → Map, because the scene reconstructs
 * flag 1. The lit row, glass card and rail update from state alone, so they
 * work while the map is loading, blocked or never loads (Review focus #4).
 *
 * MapLibre is fetched only when the Map or Fleet view is first shown, through
 * `import()` of components/map/map-client (TC-055). The Scene view's poster is server-rendered;
 * TruckScene mounts the three.js canvas over it after its first frame, or leaves the poster on a
 * weak or missing GPU (`sceneState`).
 */
export function HeroCard({ hero, fleet, scene, cities, eyes, eyesHead, cleanLine }: HeroCardProps) {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<HeroView>("scene");
  const [mapWanted, setMapWanted] = useState(false);
  const [status, setStatus] = useState<MapStatus>("off");
  const [mounted, setMounted] = useState(0);
  const [sceneState, setSceneState] = useState<SceneState>("poster");
  const cardRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const handle = useRef<HeroMapHandle | null>(null);

  const changeView = (v: HeroView) => {
    setView(v);
    if (v === "scene") setSelected(0);
    else setMapWanted(true);
  };
  const select = (i: number) => {
    setSelected(i);
    if (view === "fleet" || (view === "scene" && i > 0)) {
      setView("map");
      setMapWanted(true);
    }
  };

  // The map's marker handler and its first frame read the latest state through refs.
  const latest = useRef({ select, view, selected });
  useEffect(() => {
    latest.current = { select, view, selected };
  });

  // Deep links (`?view=map`, `?view=fleet`, `?flag=n`); the page itself is static.
  useEffect(() => {
    const init = fromUrl(window.location.search, hero.length);
    if (!init) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-time read of the URL after hydration (the page is static)
    setView(init.view);
    setSelected(init.selected);
    setMapWanted(true);
  }, [hero.length]);

  const data = useMemo<HeroMapData>(
    () => ({
      flags: hero.map((f) => ({ n: f.n, at: f.map.at, place: f.map.place, route: f.map.route, plan: f.map.plan, bounds: f.map.bounds, markerLabel: f.map.markerLabel })),
      fleet: { trucks: fleet.trucks, bounds: fleet.bounds },
      cities,
    }),
    [hero, fleet, cities],
  );

  useEffect(() => {
    const box = mapRef.current;
    if (!mapWanted || !box) return;
    // A fresh container per mount, so a StrictMode remount never reuses the first map's element.
    const el = document.createElement("div");
    box.appendChild(el);
    let live = true;
    let h: HeroMapHandle | null = null;
    setStatus("loading");
    const { view: v, selected: s } = latest.current;
    import("@/components/map/map-client")
      .then((m) =>
        m.mountHeroMap(
          el,
          data,
          {
            onSelect: (i) => latest.current.select(i),
            onFail: () => live && setStatus("failed"),
            onReady: () => live && setStatus("ready"),
          },
          { view: v === "fleet" ? "fleet" : "map", selected: s },
        ),
      )
      .then((x) => {
        if (!live) return x.destroy();
        h = x;
        handle.current = x;
        setMounted((n) => n + 1);
      })
      .catch(() => live && setStatus("failed"));
    return () => {
      live = false;
      h?.destroy();
      el.remove();
      handle.current = null;
    };
  }, [mapWanted, data]);

  // The map mirrors the state; it never drives it.
  useEffect(() => {
    if (view !== "scene") handle.current?.show(view, selected);
  }, [view, selected, mounted]);

  const fullscreen = () => {
    const card = cardRef.current;
    if (!card) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else card.requestFullscreen?.().catch(() => {});
  };

  const flag = hero[selected] ?? hero[0];
  const content = view === "fleet" ? ({ kind: "fleet", fleet } as const) : ({ kind: "flag", flag } as const);

  return (
    <section className="hero-row">
      {/* where it happened: the flagged trips on a real, tilted night map */}
      <article ref={cardRef} className={view === "scene" ? "panel mapcard is-scene" : "panel mapcard"} id="mapcard" aria-labelledby="map-h" data-map={status}>
        {/* Scene: the poster (loading and fallback); the three.js canvas is prepended over it once its first frame is drawn. */}
        <div
          ref={sceneRef}
          className={sceneState === "poster" ? "truck3d" : `truck3d ${sceneState}`}
          id="scene"
          role="img"
          aria-label={scene.ariaLabel}
          data-slot="scene"
          data-scene={sceneState}
          style={{ backgroundImage: "none" }}
        >
          <Image src={scene.poster} alt="" fill preload sizes="(max-width: 1180px) 100vw, 60vw" style={{ objectFit: "cover", objectPosition: "30% center" }} />
          <div className="scene-tag glass" aria-hidden="true">
            <span className="plate">{scene.plate}</span>
            <span>{scene.status}</span>
            <b className="loss">{scene.loss}</b>
            <small>{scene.source}</small>
          </div>
        </div>
        <SceneBoundary onError={() => setSceneState("fallback")}>
          <TruckScene host={sceneRef} active={view === "scene"} plate={scene.plate} onState={setSceneState} />
        </SceneBoundary>
        {/* role="group", not the mockup's "img": the numbered flag markers inside are buttons, and an img's children are hidden from assistive tech. */}
        <div className="map" id="heroMap" ref={mapRef} role="group" aria-label={view === "fleet" ? fleet.ariaLabel : flag.map.ariaLabel}></div>
        <div className="fade"></div>
        {status === "failed" && (
          <p className="glass map-fail">
            <Icon name="pin" />
            {MAP_UNAVAILABLE}
          </p>
        )}
        <div className="mc-top">
          <h2 id="map-h">Where it happened</h2>
          <div className="right">
            <HeroSwitch view={view} onChange={changeView} />
            <button type="button" className="iconbtn" id="fs" aria-label="Full screen map" onClick={fullscreen}>
              <Icon name="expand" />
            </button>
          </div>
        </div>
        <GlassCard content={content} />
        <RailBox content={content} />
      </article>

      <EyesList eyes={eyes} head={eyesHead} cleanLine={cleanLine} selected={eyes[selected]?.n} onSelect={(n) => select(eyes.findIndex((e) => e.n === n))} />
    </section>
  );
}
