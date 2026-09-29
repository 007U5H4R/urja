import { describe, expect, it } from "vitest";
import { R1 } from "./constants";
import { distanceToPathM, haversineM } from "./geo";
import { BEHROR_PARKING_0926_04, PLACES, placeById } from "./places";
import { routeById } from "./routes";

describe("places", () => {
  it("has unique ids and English + Hindi names", () => {
    const ids = PLACES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PLACES) {
      expect(p.name.en.trim()).not.toBe("");
      expect(p.name.hi).toMatch(/[ऀ-ॿ]/);
    }
  });

  it("names every place the mockups name", () => {
    const en = PLACES.map((p) => p.name.en);
    for (const name of [
      "Jaipur Transport Nagar",
      "Shahpura dhaba",
      "Manoharpur plaza",
      "Behror",
      "HP pump Neemrana",
      "Shahjahanpur plaza",
      "Kherki Daula plaza",
      "Okhla, Delhi",
      "Kishangarh pump",
      "Kishangarh",
      "Udaipur",
      "Himmatnagar",
      "Ahmedabad",
      "Vadodara",
      "Bharuch",
      "Surat",
      "Vapi",
      "Bhiwandi",
      "Manesar",
      "Delhi",
      "Jaipur",
      "Mumbai",
    ]) {
      expect(en, name).toContain(name);
    }
  });

  it("seeds coordinates from final/map.js P", () => {
    expect(placeById("behror").lngLat).toEqual([76.255, 27.869]);
    expect(placeById("neemrana-hp").lngLat).toEqual([76.386, 27.987]);
    expect(placeById("kishangarh-pump").lngLat).toEqual([74.86, 26.58]);
    expect(placeById("shahpura-dhaba").lngLat).toEqual([75.959, 27.389]);
    expect(placeById("okhla").lngLat).toEqual([77.27, 28.53]);
  });

  it("pumps carry the R1 geofence", () => {
    for (const p of PLACES.filter((q) => q.kind === "pump")) expect(p.geofenceM).toBe(R1.pumpGeofenceM);
  });

  it("throws on an unknown id", () => {
    expect(() => placeById("nowhere")).toThrow(/nowhere/);
  });

  describe("0926-04 parking point near Behror", () => {
    it("is 1.6 ± 0.05 km off the NH48 path", () => {
      const km = distanceToPathM(BEHROR_PARKING_0926_04, routeById("JAI-OKH").path) / 1000;
      expect(Math.abs(km - 1.6)).toBeLessThanOrEqual(0.05);
    });

    it("has its nearest pump 3.1 ± 0.05 km away, and no pump closer", () => {
      const pumps = PLACES.filter((p) => p.kind === "pump")
        .map((p) => ({ id: p.id, km: haversineM(BEHROR_PARKING_0926_04, p.lngLat) / 1000 }))
        .sort((a, b) => a.km - b.km);
      expect(pumps[0].id).toBe("behror-pump");
      expect(Math.abs(pumps[0].km - 3.1)).toBeLessThanOrEqual(0.05);
      expect(pumps[1].km).toBeGreaterThan(3.1);
    });

    it("sits outside every pump geofence", () => {
      for (const p of PLACES.filter((q) => q.kind === "pump")) {
        expect(haversineM(BEHROR_PARKING_0926_04, p.lngLat)).toBeGreaterThan(R1.pumpGeofenceM);
      }
    });
  });
});
