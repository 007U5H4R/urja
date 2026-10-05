import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";

import { DISPOSE_STEPS, disposeScene, type DisposeParts } from "./dispose";

// TSK-14.2 · technical-plan §7 "Disposal": on unmount, dispose() runs eight steps in order,
// and every geometry, material and texture is disposed exactly once (the registry counts them).

const canvasTex = () => new THREE.Texture();

/** A real three scene, like the truck's: shared geometry and materials, textured materials, lines. */
function buildScene() {
  const scene = new THREE.Scene();
  const glow = canvasTex();
  const plate = canvasTex();
  const shared = new THREE.BoxGeometry(1, 1, 1);
  const body = new THREE.MeshStandardMaterial({ color: 0x1d1a17 });
  const plateMat = new THREE.MeshBasicMaterial({ map: plate });
  const discMat = new THREE.MeshBasicMaterial({ map: glow });
  const edge = new THREE.LineBasicMaterial({ color: 0xffe0b3 });
  const group = new THREE.Group();
  scene.add(group);
  group.add(new THREE.Mesh(shared, body), new THREE.Mesh(shared, body)); // shared geometry + material
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), plateMat));
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), discMat));
  scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(shared), edge));
  scene.add(new THREE.PointLight(0xff3b2f, 9, 7, 2)); // no geometry: skipped
  // 4 geometries (box, plane, plane, edges), 4 materials, 2 textures
  return { scene, textures: [glow, plate] };
}

function fakeParts(order: string[]) {
  const { scene, textures } = buildScene();
  const env = canvasTex();
  scene.environment = env;
  const pass = (n: string) => ({ dispose: vi.fn(() => order.push(`pass:${n}`)) });
  const passes = [pass("render"), pass("bloom"), pass("output")];
  const gl = { isContextLost: vi.fn(() => false) };
  const parts: DisposeParts = {
    cancelFrame: vi.fn(() => order.push("raf")),
    controls: { dispose: vi.fn(() => order.push("controls")) },
    scene,
    composer: { passes, dispose: vi.fn(() => order.push("composer")) },
    pmrem: { dispose: vi.fn(() => order.push("pmrem")) },
    environment: env,
    renderer: {
      dispose: vi.fn(() => order.push("renderer")),
      forceContextLoss: vi.fn(() => order.push("contextloss")),
      getContext: () => gl,
    },
    canvas: { remove: vi.fn(() => order.push("canvas")) },
    observers: [{ disconnect: vi.fn(() => order.push("io")) }, { disconnect: vi.fn(() => order.push("ro")) }],
    listeners: [vi.fn(() => order.push("off:visibility")), vi.fn(() => order.push("off:contextlost"))],
  };
  return { parts, textures, env, passes, gl };
}

describe("disposeScene", () => {
  it("names the eight steps of technical-plan §7 in order", () => {
    expect(DISPOSE_STEPS).toEqual(["cancelAnimationFrame", "controls", "scene", "composer", "environment", "renderer", "canvas", "observers"]);
  });

  it("runs the steps in order and reports them", () => {
    const order: string[] = [];
    const { parts } = fakeParts(order);
    const report = disposeScene(parts);
    expect(report.steps).toEqual([...DISPOSE_STEPS]);
    expect(order).toEqual([
      "raf",
      "controls",
      "pass:render",
      "pass:bloom",
      "pass:output",
      "composer",
      "pmrem",
      "renderer",
      "contextloss",
      "canvas",
      "io",
      "ro",
      "off:visibility",
      "off:contextlost",
    ]);
  });

  it("disposes every geometry, material and texture exactly once, before the renderer", () => {
    const order: string[] = [];
    const { parts, textures, env } = fakeParts(order);
    const spies = new Map<object, ReturnType<typeof vi.fn>>();
    const seen = new Set<object>();
    parts.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) seen.add(m.geometry);
      if (m.material) seen.add(m.material as THREE.Material);
    });
    for (const t of [...textures, env]) seen.add(t);
    for (const obj of seen) {
      const d = obj as { dispose: () => void };
      const spy = vi.fn(() => order.push("res"));
      d.dispose = spy;
      spies.set(obj, spy);
    }
    const report = disposeScene(parts);
    expect(report.counts).toEqual({ geometries: 4, materials: 4, textures: 3, passes: 3, observers: 2, listeners: 2 });
    for (const spy of spies.values()) expect(spy).toHaveBeenCalledTimes(1);
    // step 3 (scene) and step 5 (environment) run before step 6 (renderer)
    expect(order.lastIndexOf("res")).toBeLessThan(order.indexOf("renderer"));
    expect(order.indexOf("res")).toBeGreaterThan(order.indexOf("controls"));
  });

  it("skips forceContextLoss when the context is already lost (context-loss path)", () => {
    const order: string[] = [];
    const { parts, gl } = fakeParts(order);
    gl.isContextLost.mockReturnValue(true);
    disposeScene(parts);
    expect(parts.renderer.dispose).toHaveBeenCalledTimes(1);
    expect(parts.renderer.forceContextLoss).not.toHaveBeenCalled();
  });

  it("keeps going when one step throws, so the context is still released", () => {
    const order: string[] = [];
    const { parts } = fakeParts(order);
    parts.controls.dispose = vi.fn(() => {
      throw new Error("boom");
    });
    const report = disposeScene(parts);
    expect(report.steps).toEqual([...DISPOSE_STEPS]);
    expect(report.errors).toEqual(["controls"]);
    expect(parts.renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(parts.canvas.remove).toHaveBeenCalledTimes(1);
  });
});
