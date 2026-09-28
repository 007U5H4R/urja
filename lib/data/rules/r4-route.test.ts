import { describe, expect, it } from "vitest";
import { detectR4 } from "./r4-route";
import { besideRoute, synthTrip } from "./test-trip";

describe("R4 · route deviation (TC-011)", () => {
  it("does not fire at 6.0% over the planned km", () => {
    expect(detectR4(synthTrip({ actualKm: 286 * 1.06 }))).toEqual([]);
  });

  it("fires at 6.1% over, charging the extra km at the truck's km/L (to ₹10)", () => {
    const [f] = detectR4(synthTrip({ actualKm: 286 * 1.061 }));
    // Ramesh on JAI-OKH: 286 km / 80 L = 3.575 km/L; 17.446 km × 90 / 3.575 = ₹439.2 → ₹440.
    expect([f.rule, f.inr]).toEqual(["R4", 440]);
  });

  it("fires on a 10.1 km detour off the path, and not on a 9.9 km one", () => {
    const detour = (km: number) =>
      synthTrip({
        speed: (t) => (t >= 100 && t < 110 ? km * 6 : 50),
        at: (t, routeKm) => (t >= 100 && t <= 110 ? besideRoute("JAI-OKH", routeKm, 2000) : null),
      });
    expect(detectR4(detour(9.9))).toEqual([]);
    const [f] = detectR4(detour(10.1));
    expect(f.rule).toBe("R4");
  });

  it("charges only the off-path stretch when the distance test does not fire", () => {
    const detour = (actualKm: number) =>
      synthTrip({
        actualKm,
        speed: (t) => (t >= 100 && t < 110 ? 60.6 : 50),
        at: (t, routeKm) => (t >= 100 && t <= 110 ? besideRoute("JAI-OKH", routeKm, 2000) : null),
      });
    // 10.1 km × ₹90 ÷ 3.575 km/L = ₹254.3 → ₹250, whatever the (non-firing) odometer excess.
    expect(detectR4(detour(286))[0].inr).toBe(250);
    expect(detectR4(detour(286 + 12))[0].inr).toBe(250);
    // When the distance test fires, the extra km are actual − planned: 20 km → ₹503.5 → ₹500.
    expect(detectR4(detour(306))[0].inr).toBe(500);
  });
});
