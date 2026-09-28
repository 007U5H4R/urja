/** Seed for every scenario-generator choice (technical-plan §4.7): "URJA" in ASCII. */
export const SCENARIO_SEED = 0x55524a41;

/**
 * mulberry32: a small, fast 32-bit seeded PRNG. Returns a function that
 * yields floats in [0, 1). The same seed always yields the same sequence.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
