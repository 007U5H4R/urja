"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { Icon } from "@/components/ui/Icon";
import { glStats } from "./gl-count";
import { loseContext, probeWebGL } from "./gpu-guard";
import type { SceneApi } from "./truck-scene";

/** poster: loading (the server-rendered poster) · ready: the live canvas covers it · fallback: the poster stays. */
export type SceneState = "poster" | "ready" | "fallback";

export interface TruckSceneProps {
  /** The hero's `.truck3d` container (poster + scene tag); the canvas is prepended into it. */
  host: RefObject<HTMLElement | null>;
  /** The Scene view is showing: run the loop. Otherwise it's paused (the canvas is hidden). */
  active: boolean;
  plate: string;
  onState: (s: SceneState) => void;
}

// TC-030's automated check reads the live-context count. A non-secret debug flag, inlined at
// build time by next.config.ts ("1" only in the e2e build, playwright.config.ts): in any other
// build DEBUG_GL is the constant false, the minifier drops every branch below that reads it, and
// `pnpm check:bundle` fails if `__urjaGL` or `__urjaGLForce` survive.
const DEBUG_GL = process.env.NEXT_PUBLIC_DEBUG_GL === "1";
type DebugWindow = Window & { __urjaGL?: typeof glStats; __urjaGLForce?: boolean };
if (DEBUG_GL && typeof window !== "undefined") (window as DebugWindow).__urjaGL = glStats;

type Idle = { cancel(): void };
function whenIdle(fn: () => void): Idle {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 2000 });
    return { cancel: () => window.cancelIdleCallback(id) };
  }
  const id = window.setTimeout(fn, 200); // Safari: no requestIdleCallback
  return { cancel: () => window.clearTimeout(id) };
}

/**
 * The live 3D scene over the hero poster (TKT-14). HeroCard loads this with `next/dynamic`
 * (`ssr: false`). In an idle callback after the Scene view is first shown, it runs the GPU guard
 * and, only on a hardware GPU, fetches the three.js module, so the poster paints first, three is
 * never in `/`'s initial JS, and a weak device never downloads it.
 *
 * It renders only the scene controls (rotate left / right, reset) beside the container: the
 * container is `role="img"`, whose children are presentational, so buttons can't live inside.
 */
export default function TruckScene({ host, active, plate, onState }: TruckSceneProps) {
  // Load once the Scene view has been shown (a `?view=map` deep link waits for the switch).
  const [wanted, setWanted] = useState(active);
  if (active && !wanted) setWanted(true);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(0);
  const api = useRef<SceneApi | null>(null);
  const ctl = useRef<HTMLDivElement>(null);
  const report = useRef(onState);
  useEffect(() => {
    report.current = onState;
  });

  useEffect(() => {
    const el = host.current;
    if (!wanted || !el) return;
    let live = true;
    let scene: SceneApi | null = null;
    const fail = () => {
      scene?.dispose();
      scene = api.current = null;
      if (!live) return;
      // The buttons are about to go: don't drop keyboard focus on the floor.
      if (ctl.current?.contains(document.activeElement)) {
        el.closest("article")?.querySelector<HTMLElement>('.seg button[data-mode="scene"]')?.focus();
      }
      setReady(false);
      report.current("fallback");
    };
    const idle = whenIdle(() => {
      // The guard first: a missing or software GPU never downloads three at all.
      const probe = probeWebGL(DEBUG_GL && (window as DebugWindow).__urjaGLForce === true);
      if (!probe.ok) return fail();
      let handed = false;
      import("./truck-scene")
        .then((m) => {
          if (!live) return null;
          handed = true;
          return m.createTruckScene(el, {
            plate,
            probe,
            isLive: () => live,
            still: new URLSearchParams(window.location.search).has("still"),
            onFirstFrame: () => {
              if (!live) return;
              setReady(true);
              report.current("ready");
            },
            onFallback: fail, // the renderer failed, or the context was lost later
          });
        })
        .then((a) => {
          if (!handed) loseContext(probe.gl); // unmounted while the chunk loaded
          if (!a) return;
          if (!live) {
            a.dispose();
            return;
          }
          scene = api.current = a;
          setMounted((n) => n + 1);
        })
        .catch(() => {
          if (!handed) loseContext(probe.gl);
          fail();
        });
    });
    return () => {
      live = false;
      idle.cancel();
      scene?.dispose();
      scene = api.current = null;
    };
  }, [wanted, host, plate]);

  // Render only while the Scene view shows (IntersectionObserver and visibilitychange inside).
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    if (active) a.start();
    else a.stop();
  }, [active, mounted]);

  if (!ready || !active) return null;
  return (
    <div ref={ctl} className="scene-ctl" role="group" aria-label="Scene view">
      <button type="button" className="iconbtn" aria-label="Rotate the scene left" onClick={() => api.current?.rotate(-1)}>
        <Icon name="left" />
      </button>
      <button type="button" className="iconbtn" aria-label="Rotate the scene right" onClick={() => api.current?.rotate(1)}>
        <Icon name="right" />
      </button>
      <button type="button" className="iconbtn" aria-label="Reset the scene view" onClick={() => api.current?.reset()}>
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12a8 8 0 1 0 2.4-5.7" />
          <path d="M4 4v4.5h4.5" />
        </svg>
      </button>
    </div>
  );
}
