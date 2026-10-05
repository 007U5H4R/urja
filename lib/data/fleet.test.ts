import { describe, expect, it } from "vitest";
import { r3Fires } from "./constants";
import { FLEET, baselineClFor, kmPerLitre, truckByPlate } from "./fleet";
import { INTERCITY_ROUTE_IDS, localRoute } from "./routes";

// §4.3 fleet table, rank order.
const ANCHOR: [string, string, string, number][] = [
  ["RJ14 GC 7710", "Mahesh Meena", "महेश मीणा", 2016],
  ["RJ14 GA 2204", "Suresh Yadav", "सुरेश यादव", 2018],
  ["RJ14 GB 1450", "Imran Khan", "इमरान ख़ान", 2017],
  ["RJ14 GC 0931", "Balwant Singh", "बलवंत सिंह", 2015],
  ["RJ14 GA 6618", "Deepak Sharma", "दीपक शर्मा", 2020],
  ["RJ14 GB 3087", "Rajesh Saini", "राजेश सैनी", 2019],
  ["RJ14 GA 7345", "Mohan Lal Meghwal", "मोहन लाल मेघवाल", 2014],
  ["RJ14 GC 1268", "Harish Rawat", "हरीश रावत", 2021],
  ["RJ14 GB 5590", "Kamal Kishore", "कमल किशोर", 2018],
  ["RJ14 GA 4411", "Prakash Bishnoi", "प्रकाश बिश्नोई", 2017],
  ["RJ14 GC 8826", "Salim Qureshi", "सलीम क़ुरैशी", 2016],
  ["RJ14 GB 2903", "Gopal Prajapat", "गोपाल प्रजापत", 2022],
  ["RJ14 GA 9152", "Naresh Mahawar", "नरेश महावर", 2019],
  ["RJ14 GC 4470", "Dinesh Jangid", "दिनेश जांगिड़", 2020],
  ["RJ14 GB 6134", "Jagdish Swami", "जगदीश स्वामी", 2013],
  ["RJ14 GA 3378", "Rakesh Verma", "राकेश वर्मा", 2018],
  ["RJ14 GC 5021", "Ashok Kumawat", "अशोक कुमावत", 2021],
  ["RJ14 GB 7716", "Sunil Joshi", "सुनील जोशी", 2019],
  ["RJ14 GA 5023", "Rajendra Singh", "राजेंद्र सिंह", 2016],
  ["RJ14 GC 2689", "Farhan Ali", "फ़रहान अली", 2022],
  ["RJ14 GB 8352", "Bhupendra Rathore", "भूपेंद्र राठौड़", 2017],
  ["RJ14 GA 1182", "Vikram Choudhary", "विक्रम चौधरी", 2018],
  ["RJ14 GB 4521", "Ramesh Kumar", "रमेश कुमार", 2019],
  ["RJ14 GC 3309", "Anil Bairwa", "अनिल बैरवा", 2017],
];

describe("fleet (§4.3)", () => {
  it("has 24 trucks in anchor rank order with plates, drivers and since-years", () => {
    expect(FLEET).toHaveLength(24);
    expect(FLEET.map((t) => [t.plate, t.driver.name.en, t.driver.name.hi, t.driver.since])).toEqual(ANCHOR);
  });

  it("every plate is unique", () => {
    expect(new Set(FLEET.map((t) => t.plate)).size).toBe(24);
  });

  it("every truck has a whole-litre baseline and a usual load on every intercity route", () => {
    for (const t of FLEET) {
      expect(Object.keys(t.baselineCl).sort()).toEqual([...INTERCITY_ROUTE_IDS].sort());
      expect(Object.keys(t.usualLoadT).sort()).toEqual([...INTERCITY_ROUTE_IDS].sort());
      for (const id of INTERCITY_ROUTE_IDS) {
        expect(t.baselineCl[id] % 100, `${t.plate} ${id}`).toBe(0);
        // Plausible heavy-truck economy: 3–4.2 km/L.
        const kmpl = kmPerLitre(t, id);
        expect(kmpl, `${t.plate} ${id}`).toBeGreaterThanOrEqual(3);
        expect(kmpl, `${t.plate} ${id}`).toBeLessThanOrEqual(4.2);
        expect(t.usualLoadT[id]).toBeGreaterThan(0);
      }
    }
  });

  it("Anil's JAI-BHW baseline is 325 L with a usual load of 22 t", () => {
    const anil = truckByPlate("RJ14 GC 3309");
    expect(anil.baselineCl["JAI-BHW"]).toBe(32500);
    expect(anil.usualLoadT["JAI-BHW"]).toBe(22);
    // Flag 3: 364 L used is exactly 12.0% over, so R3 fires (inclusive), and 26 t > 22 t caps it at Check.
    expect(r3Fires(36400, anil.baselineCl["JAI-BHW"])).toBe(true);
  });

  it("Ramesh's JAI-OKH baseline keeps 0926-04's 80 L of normal use clean", () => {
    const ramesh = truckByPlate("RJ14 GB 4521");
    expect(ramesh.baselineCl["JAI-OKH"]).toBe(8000);
    // Tank: 210 L at the start + 138 L refuel rise − 230 L on arrival = 118 L,
    // of which 38 L is unaccounted (R1), leaving 80 L of normal use.
    const usedCl = (210 + 138 - 230 - 38) * 100;
    expect(usedCl).toBe(8000);
    expect(r3Fires(usedCl, ramesh.baselineCl["JAI-OKH"])).toBe(false);
    // 24 t of cement is a usual load.
    expect(ramesh.usualLoadT["JAI-OKH"]).toBeGreaterThanOrEqual(24);
  });

  it("Vikram's AHM-JAI baseline keeps flag 2 an R2-only trip", () => {
    const vikram = truckByPlate("RJ14 GA 1182");
    const base = vikram.baselineCl["AHM-JAI"];
    expect(base).toBe(18900);
    // Clean physics runs at baseline ±3% (§4.7), so the worst case stays under 1.12×.
    const worstUsedCl = Math.round(base * 1.03);
    expect(r3Fires(worstUsedCl, base)).toBe(false);
    // Guard for the rules unit: counting the 50 L short at Kishangarh as consumption
    // WOULD cross the R3 line, which is why §4.4 subtracts the R2 litres.
    expect(r3Fires(worstUsedCl + 5000, base)).toBe(true);
  });

  it("local runs scale by km at city economy", () => {
    const t = FLEET[0];
    const r = localRoute(80);
    const cl = baselineClFor(t, r.id);
    expect(cl % 100).toBe(0);
    expect(r.plannedKm / (cl / 100)).toBeLessThan(kmPerLitre(t, "JAI-KSG"));
    expect(kmPerLitre(t, r.id)).toBeCloseTo(r.plannedKm / (cl / 100), 9);
    expect(t.usualLoadT[r.id]).toBeUndefined();
  });

  it("baselineClFor returns the stored value for intercity routes", () => {
    for (const t of FLEET) for (const id of INTERCITY_ROUTE_IDS) expect(baselineClFor(t, id)).toBe(t.baselineCl[id]);
  });

  it("truckByPlate throws on an unknown plate", () => {
    expect(truckByPlate("RJ14 GB 4521").driver.name.en).toBe("Ramesh Kumar");
    expect(() => truckByPlate("RJ14 ZZ 0000")).toThrow(/RJ14 ZZ 0000/);
  });
});
