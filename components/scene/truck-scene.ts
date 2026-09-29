/**
 * The Today hero's 3D scene: a typed port of .design/exploration/final/truck3d.js (Design.md §26,
 * technical-plan §7). It reconstructs flag 1: RJ14 GB 4521 parked on the left shoulder of NH48
 * near Behror, ignition off, its fuel tank lit red. Camera, target, materials, lights, bloom,
 * tone mapping, environment and fog are copied verbatim from the approved prototype.
 *
 * This is the only module that imports three.js. The wrapper (TruckScene.tsx) loads it with a
 * dynamic `import()` after first paint, on `/` only, so three never ships in an initial bundle
 * (TC-055).
 *
 * Changes from the prototype, all for robustness (§7), none visible:
 * - The guard (gpu-guard.ts `probeWebGL`) runs before three is involved: the wrapper probes
 *   before it even fetches this module, so a missing or software GPU never downloads three nor
 *   constructs a WebGLRenderer (whose failure path logs console.error). A software context is
 *   released at once; a hardware one is handed to the renderer, not re-created.
 * - Classes on the host (`ready`, `fallback`) are the wrapper's job, through `onFirstFrame` and
 *   `onFallback`; React owns the host's className.
 * - Reduced motion and `?still` render once, then again only when the user drags or presses a
 *   button (no loop, no damping). Visibility tracks the viewport and the tab separately.
 * - `rotate`, `dispose` (the §7 order, see dispose.ts), context loss → poster, and the
 *   RoomEnvironment's own geometry freed once the PMREM is baked.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { disposeScene, type DisposeReport } from "./dispose";
import { glStats } from "./gl-count";
import { loseContext, pixelRatioFor, probeWebGL, type FallbackReason, type Probe } from "./gpu-guard";

export type { FallbackReason };
export type Vec3 = readonly [number, number, number];

export interface TruckSceneOptions {
  /** The flagged truck's plate, from the view model (HeroScene.plate). */
  plate: string;
  /** `?still`: render one frame (poster capture, screenshots). */
  still?: boolean;
  /** prefers-reduced-motion; read from matchMedia when omitted. */
  reduced?: boolean;
  /** (pointer: coarse); read from matchMedia when omitted. No drag, lower pixel ratio. */
  coarse?: boolean;
  /** Skip the software-GPU guard (debug builds only; see TruckScene.tsx). */
  forceSoftware?: boolean;
  /** A hardware context the wrapper already probed (gpu-guard.ts); probed here when omitted. */
  probe?: Extract<Probe, { ok: true }>;
  /** False once the caller has unmounted: checked after the font wait, before any GPU work. */
  isLive?: () => boolean;
  target?: Vec3;
  cam?: Vec3;
  /** The first frame has been drawn: the canvas may cover the poster. */
  onFirstFrame?: () => void;
  /** The scene can't (or can no longer) render: keep or restore the poster. */
  onFallback?: (reason: FallbackReason) => void;
}

export interface SceneApi {
  start(): void;
  stop(): void;
  renderOnce(): void;
  /** Orbit one step left (−1) or right (1), within the azimuth limits. */
  rotate(dir: -1 | 1): void;
  reset(): void;
  /** Frees everything in the technical-plan §7 order. Idempotent; the report counts disposals. */
  dispose(): DisposeReport | null;
}

/** One press of rotate-left/right: a third of the ±0.75 rad drag range. */
export const ROTATE_STEP = 0.25;

const mq = (q: string) => typeof matchMedia === "function" && matchMedia(q).matches;

export async function createTruckScene(el: HTMLElement, opts: TruckSceneOptions): Promise<SceneApi | null> {
  const still = !!opts.still;
  const reduced = (opts.reduced ?? mq("(prefers-reduced-motion: reduce)")) || still;
  const coarse = opts.coarse ?? mq("(pointer: coarse)");
  const fallback = (reason: FallbackReason) => {
    opts.onFallback?.(reason);
    return null;
  };

  // The plate's face (next/font's Anek Devanagari) before any GPU work, so an unmount during
  // the wait holds nothing.
  const fontHi = typeof getComputedStyle === "function" ? getComputedStyle(document.documentElement).getPropertyValue("--font-hi").trim() : "";
  const plateFont = `700 78px ${fontHi ? `${fontHi}, ` : ""}"Anek Devanagari", "Arial Narrow", sans-serif`;
  if (document.fonts) {
    try {
      await document.fonts.load(plateFont, opts.plate);
      await document.fonts.ready;
    } catch {
      /* the fallback face will do */
    }
  }

  // Unmounted during the wait: release the probed context and build nothing (not a fallback).
  if (opts.isLive && !opts.isLive()) {
    if (opts.probe) loseContext(opts.probe.gl);
    return null;
  }

  // ---------- guard: WebGL2 at all, then software WebGL (SwiftShader, llvmpipe, VMs) ----------
  const probe = opts.probe ?? probeWebGL(opts.forceSoftware);
  if (!probe.ok) return fallback(probe.reason);
  const { canvas, gl } = probe;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, powerPreference: "high-performance" });
  } catch {
    loseContext(gl);
    return fallback("renderer");
  }
  glStats.live++;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    glStats.live--;
  };
  const partial: { api: SceneApi | null } = { api: null };
  try {
    return build();
  } catch {
    // Anything failing mid-build or on the first frame (a shader, a pass): free it all, keep the poster.
    if (partial.api) partial.api.dispose();
    else {
      renderer.domElement.remove();
      renderer.dispose();
      if (!gl.isContextLost()) renderer.forceContextLoss();
      release();
    }
    return fallback("renderer");
  }

  function build(): SceneApi {

    const W = () => Math.max(1, el.clientWidth),
      H = () => Math.max(1, el.clientHeight);
    renderer.setPixelRatio(pixelRatioFor(devicePixelRatio, coarse));
    renderer.setSize(W(), H());
    renderer.setClearColor(0x0b0a09, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.touchAction = "pan-y";
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0a09);
    scene.fog = new THREE.FogExp2(0x0b0a09, 0.0125);
    const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 700);
    // soft reflections so the dark metal panels read (like the reference's glossy truck)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04); // kept, so dispose() frees the render target, not just its texture
    room.dispose();
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.22;

    // ---------- textures ----------
    const tex = (w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      draw(c.getContext("2d")!, w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };
    const glow = tex(128, 128, (x) => {
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,.45)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
    });
    const tail = tex(256, 4, (x) => {
      const g = x.createLinearGradient(0, 0, 256, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.85, "rgba(255,255,255,.9)");
      g.addColorStop(1, "rgba(255,255,255,1)");
      x.fillStyle = g;
      x.fillRect(0, 0, 256, 4);
    });
    const asphalt = tex(256, 256, (x) => {
      x.fillStyle = "#100e0c";
      x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) {
        const v = (14 + Math.random() * 16) | 0;
        x.fillStyle = `rgb(${v + 4},${v + 2},${v})`;
        x.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
      }
    });
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    asphalt.repeat.set(90, 3);
    const plateTex = tex(512, 128, (x) => {
      x.fillStyle = "#f2cf38";
      x.fillRect(0, 0, 512, 128);
      x.strokeStyle = "#1b1a14";
      x.lineWidth = 8;
      x.strokeRect(6, 6, 500, 116);
      x.fillStyle = "#16140f";
      x.font = plateFont;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(opts.plate, 256, 70);
    });

    // ---------- materials ----------
    const M = {
      body: new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: 0.48, metalness: 0.6 }),
      cargo: new THREE.MeshStandardMaterial({ color: 0x2b251f, roughness: 0.82, metalness: 0.12 }),
      rib: new THREE.MeshStandardMaterial({ color: 0x3a3229, roughness: 0.6, metalness: 0.35 }),
      tarp: new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.95 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 }),
      hub: new THREE.MeshStandardMaterial({ color: 0x8a7c6c, roughness: 0.3, metalness: 0.9 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.06, metalness: 0.95 }),
      edge: new THREE.LineBasicMaterial({ color: 0xffe0b3, transparent: true, opacity: 0.9, toneMapped: false }),
      amber: new THREE.MeshBasicMaterial({ color: 0xffa04a, toneMapped: false }),
      red: new THREE.MeshBasicMaterial({ color: 0xff3a2e, toneMapped: false }),
      off: new THREE.MeshStandardMaterial({ color: 0x2c2a27, roughness: 0.2, metalness: 0.8 }),
      tank: new THREE.MeshStandardMaterial({ color: 0x3a0e0a, emissive: 0xff3b2f, emissiveIntensity: 2.2, roughness: 0.35, metalness: 0.6 }),
      plate: new THREE.MeshBasicMaterial({ map: plateTex, toneMapped: false }),
    };
    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent?: THREE.Object3D) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      (parent || scene).add(m);
      return m;
    };
    const edges = (mesh: THREE.Mesh, thr = 25) => {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, thr), M.edge);
      l.position.copy(mesh.position);
      l.rotation.copy(mesh.rotation);
      mesh.parent!.add(l);
      return l;
    };
    const disc = (size: number, color: number, opacity: number, x: number, z: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map: glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.03, z);
      scene.add(m);
      return m;
    };

    // ---------- road: NH48 at night, the truck on the shoulder ----------
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(900, 14.5), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.92 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -2);
    scene.add(road);
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(70, 10), new THREE.MeshStandardMaterial({ color: 0x15120f, roughness: 1 }));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(0, 0.005, 11);
    scene.add(patch);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xb08e62, transparent: true, opacity: 0.7, toneMapped: false });
    for (const z of [-5.6, -2, 1.6]) for (let x = -300; x < 300; x += 11) box(4.2, 0.01, 0.14, markMat, x, 0.01, z);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xc49a66, transparent: true, opacity: 0.7, toneMapped: false });
    box(900, 0.01, 0.16, lineMat, 0, 0.012, -9.1);
    box(900, 0.01, 0.16, lineMat, 0, 0.012, 5.1);

    // ---------- traffic light-trails (the highway keeps moving; the truck doesn't) ----------
    const trails: { m: THREE.Mesh; v: number }[] = [];
    const lanes = [
      { z: 3.3, dir: -1, c: 0xffe6c2 },
      { z: -0.2, dir: -1, c: 0xffe6c2 },
      { z: -3.8, dir: 1, c: 0xff4636 },
      { z: -7.3, dir: 1, c: 0xff4636 },
    ];
    lanes.forEach((ln) => {
      for (let k = 0; k < 5; k++) {
        const L = 10 + Math.random() * 16;
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(L, 0.46),
          new THREE.MeshBasicMaterial({ map: tail, color: ln.c, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
        );
        m.rotation.x = -Math.PI / 2;
        if (ln.dir > 0) m.rotation.z = Math.PI;
        m.position.set(-220 + Math.random() * 440, 0.75, ln.z + (Math.random() - 0.5) * 0.6);
        scene.add(m);
        trails.push({ m, v: (20 + Math.random() * 12) * ln.dir });
      }
    });

    // ---------- the truck (Indian heavy truck, closed cargo body) ----------
    const T = new THREE.Group();
    T.position.set(0, 0, 11);
    T.rotation.y = Math.PI;
    scene.add(T);
    box(10.8, 0.32, 2.2, M.body, 0, 0.95, 0, T); // chassis
    const s = new THREE.Shape(); // cab profile (side view)
    s.moveTo(0, 0);
    s.lineTo(2.3, 0);
    s.lineTo(2.3, 1.5);
    s.lineTo(2.08, 2.52);
    s.quadraticCurveTo(2.0, 2.78, 1.72, 2.8);
    s.lineTo(0.16, 2.8);
    s.quadraticCurveTo(0, 2.8, 0, 2.62);
    s.lineTo(0, 0);
    const cabG = new THREE.ExtrudeGeometry(s, { depth: 2.44, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 8 });
    cabG.translate(0, 0, -1.22);
    const cab = new THREE.Mesh(cabG, M.body);
    cab.position.set(3.05, 1.08, 0);
    T.add(cab);
    edges(cab, 30);
    const ws = box(0.05, 0.95, 2.12, M.glass, 3.05 + 2.21, 1.08 + 2.0, 0, T);
    ws.rotation.z = 0.215; // windscreen
    for (const z of [1.25, -1.25]) box(1.2, 0.78, 0.03, M.glass, 3.05 + 1.25, 1.08 + 2.1, z, T); // side windows
    box(0.3, 0.42, 2.52, M.body, 5.47, 1.2, 0, T); // bumper
    box(0.46, 0.08, 2.5, M.body, 5.3, 1.08 + 2.62, 0, T); // sun visor
    const grille = box(0.04, 0.7, 1.4, M.glass, 5.37, 1.08 + 0.95, 0, T);
    edges(grille, 1); // grille
    for (const z of [1.42, -1.42]) {
      box(0.06, 0.06, 0.34, M.body, 4.9, 1.08 + 2.0, z > 0 ? z - 0.1 : z + 0.1, T);
      box(0.12, 0.52, 0.2, M.glass, 4.9, 1.08 + 2.0, z + (z > 0 ? 0.12 : -0.12), T);
    } // mirrors
    for (const z of [0.86, -0.86]) box(0.06, 0.16, 0.42, M.off, 5.63, 1.36, z, T); // headlights (ignition off)
    for (let i = 0; i < 5; i++) box(0.16, 0.1, 0.12, M.amber, 3.3 + i * 0.4, 1.08 + 2.86, 0, T); // roof marker lamps
    const plF = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), M.plate);
    plF.position.set(5.63, 0.98, 0);
    plF.rotation.y = Math.PI / 2;
    T.add(plF);
    const plR = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), M.plate);
    plR.position.set(-5.43, 1.02, 0);
    plR.rotation.y = -Math.PI / 2;
    T.add(plR);
    const cargo = box(7.9, 2.6, 2.52, M.cargo, -1.35, 1.11 + 1.3, 0, T);
    edges(cargo, 20); // cargo body
    for (let i = 0; i <= 8; i++) box(0.09, 2.62, 2.58, M.rib, -5.25 + i * 0.985, 1.11 + 1.3, 0, T); // ribs
    box(7.95, 0.12, 2.56, M.tarp, -1.35, 1.11 + 2.66, 0, T); // tarp
    for (let i = 0; i < 7; i++) for (const z of [1.3, -1.3]) box(0.12, 0.08, 0.06, M.amber, -5.0 + i * 1.25, 1.11 + 2.62, z, T); // body marker lamps
    for (const z of [0.95, -0.95]) box(0.05, 0.16, 0.34, M.red, -5.33, 1.3, z, T); // tail lamps
    const wG = new THREE.CylinderGeometry(0.53, 0.53, 0.44, 28);
    wG.rotateX(Math.PI / 2);
    const hG = new THREE.CylinderGeometry(0.25, 0.25, 0.46, 20);
    hG.rotateX(Math.PI / 2);
    for (const x of [4.25, -2.35, -3.72])
      for (const z of [1.07, -1.07]) {
        const w = new THREE.Mesh(wG, M.tire);
        w.position.set(x, 0.53, z);
        T.add(w);
        const h = new THREE.Mesh(hG, M.hub);
        h.position.set(x, 0.53, z);
        T.add(h);
      }
    // the evidence: the fuel tank, lit red
    const tG = new THREE.CylinderGeometry(0.34, 0.34, 1.5, 28);
    tG.rotateZ(Math.PI / 2);
    const tank = new THREE.Mesh(tG, M.tank);
    tank.position.set(1.95, 0.74, -1.2);
    T.add(tank);
    const tankLight = new THREE.PointLight(0xff3b2f, 9, 7, 2);
    tankLight.position.set(1.95, 0.6, -2.1);
    T.add(tankLight);
    const pool = disc(4.6, 0xff3b2f, 0.55, -1.95, 13.1);

    // ---------- the lamp: a dhaba pole light, the only warm light on the scene ----------
    box(0.14, 7.6, 0.14, M.body, -9.5, 3.8, 7.2); // pole behind the truck, road side
    box(0.09, 0.09, 1.9, M.body, -9.5, 7.55, 8.1);
    box(0.32, 0.12, 0.62, new THREE.MeshBasicMaterial({ color: 0xffd08a, toneMapped: false }), -9.5, 7.48, 8.95);
    const spot = new THREE.SpotLight(0xffb468, 360, 42, 0.8, 0.85, 2);
    spot.position.set(-9.5, 7.3, 8.95);
    spot.target.position.set(-2.5, 0, 11.4);
    scene.add(spot, spot.target);
    disc(18, 0xff9442, 0.3, -3.5, 11.8);
    scene.add(new THREE.HemisphereLight(0x3a2d22, 0x060505, 0.9));
    const rim = new THREE.DirectionalLight(0xffb070, 1.7);
    rim.position.set(30, 20, -26);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xd8c6b2, 0.35);
    fill.position.set(-14, 9, 30);
    scene.add(fill);

    // ---------- camera: high three-quarter view, like the reference ----------
    // framing: the truck sits left of the glass card, clear of the rail; phones pull back (no card there)
    const narrow = W() / H() < 1.15;
    const target = new THREE.Vector3(...(opts.target || (narrow ? ([1.2, -1.4, 10.8] as const) : ([4.3, -0.9, 10.4] as const))));
    const CAM: Vec3 = opts.cam || (narrow ? [-19, 17, 38] : [-17, 14.5, 31]);
    camera.position.set(...CAM);
    camera.lookAt(target);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !reduced; // reduced motion: no easing; each drag renders at once
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.72;
    controls.maxPolarAngle = 1.18;
    const base = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    controls.minAzimuthAngle = base.theta - 0.75;
    controls.maxAzimuthAngle = base.theta + 0.75;
    controls.enabled = !coarse; // touch: the page owns the gesture
    renderer.domElement.style.touchAction = "pan-y"; // OrbitControls' connect() set it to 'none', which would block page scroll
    let userAt = -1e9;
    const onStart = () => {
      userAt = performance.now();
    };
    controls.addEventListener("start", onStart);
    controls.update();

    // ---------- post: bloom gives the edge-light strips their glow ----------
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.72, 0.5, 0.16);
    composer.addPass(bloom);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // ---------- tag anchored to the truck (DOM, so it stays text) ----------
    const tag = el.querySelector<HTMLElement>(".scene-tag");
    const anchor = new THREE.Vector3(-2.6, 4.2, 11);
    const placeTag = () => {
      if (!tag) return;
      const v = anchor.clone().project(camera);
      tag.style.transform = `translate(${((v.x + 1) / 2) * W()}px, ${((1 - v.y) / 2) * H()}px) translate(-50%, -100%)`;
    };

    // ---------- loop (render only while visible) ----------
    const clock = new THREE.Clock();
    let running = false,
      inView = true,
      tabVisible = typeof document.hidden === "boolean" ? !document.hidden : true,
      raf = 0,
      t = 0,
      drawn = false,
      disposed = false,
      report: DisposeReport | null = null;
    const visible = () => inView && tabVisible;
    const sph = new THREE.Spherical();
    const draw = () => {
      controls.update();
      composer.render();
      placeTag();
      if (!drawn) {
        drawn = true;
        opts.onFirstFrame?.();
      }
    };
    function frame() {
      raf = 0;
      if (!running || !visible() || disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      t += dt;
      if (!reduced) {
        trails.forEach((tr) => {
          tr.m.position.x += tr.v * dt;
          if (tr.m.position.x > 230) tr.m.position.x = -230;
          if (tr.m.position.x < -230) tr.m.position.x = 230;
        });
        M.tank.emissiveIntensity = 1.7 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.3));
        tankLight.intensity = 6 + 5 * (0.5 + 0.5 * Math.sin(t * 2.3));
        (pool.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.22 * Math.sin(t * 2.3);
        if (performance.now() - userAt > 6000) {
          sph.setFromVector3(camera.position.clone().sub(controls.target));
          sph.theta += (base.theta + 0.1 * Math.sin(t * 0.22) - sph.theta) * 0.02;
          camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    /** Reduced motion / still: one frame per change (a drag, a button), coalesced. */
    let pending = 0;
    const renderSoon = () => {
      if (running || pending || disposed) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        if (!disposed) draw();
      });
    };
    controls.addEventListener("change", renderSoon);
    const resume = () => {
      if (visible() && running && !raf) raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      tabVisible = !document.hidden;
      resume();
    };
    const ro = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight || disposed) return; // hidden (Map/Fleet view): keep the last size
      // The window may have moved to a screen with another devicePixelRatio: re-apply the cap.
      const ratio = pixelRatioFor(devicePixelRatio, coarse);
      renderer.setPixelRatio(ratio);
      composer.setPixelRatio(ratio);
      renderer.setSize(W(), H());
      composer.setSize(W(), H());
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      if (!running) api.renderOnce(); // the loop draws the next frame anyway
    });
    ro.observe(el);
    const io = new IntersectionObserver((es) => {
      inView = es[es.length - 1].isIntersecting;
      resume();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", onVisibility);
    const onLost = () => {
      api.stop();
      opts.onFallback?.("contextlost");
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    const api: SceneApi = {
      start() {
        if (disposed) return;
        if (reduced) {
          api.renderOnce();
          return;
        }
        running = true;
        clock.getDelta();
        resume();
      },
      stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      reset() {
        if (disposed) return;
        camera.position.set(...CAM);
        controls.target.copy(target);
        userAt = -1e9;
        controls.update();
        if (!running) api.renderOnce();
      },
      rotate(dir) {
        if (disposed) return;
        userAt = performance.now();
        sph.setFromVector3(camera.position.clone().sub(controls.target));
        sph.theta = THREE.MathUtils.clamp(sph.theta + dir * ROTATE_STEP, controls.minAzimuthAngle, controls.maxAzimuthAngle);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
        controls.update();
        if (!running) api.renderOnce();
      },
      renderOnce() {
        if (disposed) return;
        draw();
      },
      dispose() {
        if (disposed) return report;
        disposed = true;
        report = disposeScene({
          cancelFrame: () => {
            running = false;
            if (raf) cancelAnimationFrame(raf);
            if (pending) cancelAnimationFrame(pending);
            raf = pending = 0;
          },
          controls,
          scene,
          composer,
          pmrem,
          environment: envRT,
          renderer,
          canvas: renderer.domElement,
          observers: [io, ro],
          listeners: [
            () => document.removeEventListener("visibilitychange", onVisibility),
            () => controls.removeEventListener("start", onStart),
            () => controls.removeEventListener("change", renderSoon),
            () => renderer.domElement.removeEventListener("webglcontextlost", onLost),
          ],
        });
        release();
        return report;
      },
    };
    partial.api = api;
    api.renderOnce();
    return api;
  }
}
