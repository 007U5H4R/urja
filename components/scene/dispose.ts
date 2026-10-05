/**
 * The scene's disposal, in the order technical-plan §7 fixes. Duck-typed (no three import) so
 * the unit test can drive it with a real three scene and fake GPU-side objects.
 */

export const DISPOSE_STEPS = ["cancelAnimationFrame", "controls", "scene", "composer", "environment", "renderer", "canvas", "observers"] as const;
export type DisposeStep = (typeof DISPOSE_STEPS)[number];

interface Disposable {
  dispose(): void;
}

/** The part of a three `Object3D` the traversal reads. */
interface SceneNode {
  traverse(cb: (o: SceneNode) => void): void;
  geometry?: unknown;
  material?: unknown;
  background?: unknown;
}

export interface DisposeParts {
  /** Step 1: cancels the pending animation frame and stops the loop. */
  cancelFrame(): void;
  controls: Disposable;
  scene: SceneNode;
  /** EffectComposer: its passes are not disposed by `composer.dispose()`, so each is disposed first. */
  composer: { passes: Disposable[]; dispose(): void };
  pmrem: Disposable;
  environment: Disposable | null;
  renderer: { dispose(): void; forceContextLoss(): void; getContext(): { isContextLost(): boolean } };
  canvas: { remove(): void };
  observers: { disconnect(): void }[];
  /** Removers for every listener the scene added (visibilitychange, controls, webglcontextlost). */
  listeners: (() => void)[];
}

export interface DisposeReport {
  steps: DisposeStep[];
  counts: { geometries: number; materials: number; textures: number; passes: number; observers: number; listeners: number };
  /** Steps that threw; the rest still ran, so the context is released whatever happens. */
  errors: DisposeStep[];
}

const isDisposable = (v: unknown): v is Disposable => typeof v === "object" && v !== null && typeof (v as Disposable).dispose === "function";
const isTexture = (v: unknown): v is Disposable => isDisposable(v) && (v as { isTexture?: boolean }).isTexture === true;

export function disposeScene(p: DisposeParts): DisposeReport {
  const report: DisposeReport = {
    steps: [],
    counts: { geometries: 0, materials: 0, textures: 0, passes: 0, observers: 0, listeners: 0 },
    errors: [],
  };
  const done = new Set<unknown>();
  /** Disposes `r` once, however many meshes share it. */
  const once = (r: unknown, kind: "geometries" | "materials" | "textures") => {
    if (!isDisposable(r) || done.has(r)) return;
    done.add(r);
    r.dispose();
    report.counts[kind]++;
  };
  const step = (name: DisposeStep, run: () => void) => {
    report.steps.push(name);
    try {
      run();
    } catch {
      report.errors.push(name);
    }
  };

  step("cancelAnimationFrame", () => p.cancelFrame());
  step("controls", () => p.controls.dispose());
  step("scene", () => {
    p.scene.traverse((o) => {
      once(o.geometry, "geometries");
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        for (const v of Object.values(m as object)) if (isTexture(v)) once(v, "textures");
        once(m, "materials");
      }
    });
    if (isTexture(p.scene.background)) once(p.scene.background, "textures");
  });
  step("composer", () => {
    for (const pass of p.composer.passes) {
      pass.dispose();
      report.counts.passes++;
    }
    p.composer.dispose();
  });
  step("environment", () => {
    p.pmrem.dispose();
    once(p.environment, "textures");
  });
  step("renderer", () => {
    p.renderer.dispose();
    if (!p.renderer.getContext().isContextLost()) p.renderer.forceContextLoss();
  });
  step("canvas", () => p.canvas.remove());
  step("observers", () => {
    for (const o of p.observers) {
      o.disconnect();
      report.counts.observers++;
    }
    for (const off of p.listeners) {
      off();
      report.counts.listeners++;
    }
  });
  return report;
}
