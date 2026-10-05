/**
 * DES-17, DES-22 · The labels Ask puts on cited trips and flag statuses.
 * Expected strings are written out, never computed.
 */
import { describe, expect, it } from "vitest";
import { CONFIDENCE_WORD } from "@/lib/data/rules";
import { STATUS_LABEL, citeLabels, dayLabel, tripLabel } from "./labels";

describe("tripLabel (final/index.html `.drawer .a ol li`)", () => {
  it("names the route, the day the trip started, and what the flag was", () => {
    expect(tripLabel("0926-11", "en")).toBe("Jaipur → Bhiwandi, 26 Sep: 39 L · Excess consumption");
    expect(tripLabel("0926-11", "hi")).toBe("जयपुर → भिवंडी, 26 सितंबर: 39 लीटर · सामान्य से ज़्यादा डीज़ल");
  });

  it("tells two flagged trips on one route apart (the Behror answer's 0912-05 and 0926-04)", () => {
    expect(tripLabel("0912-05", "en")).toBe("Jaipur → Delhi (Okhla), 12 Sep: 69 L · Stationary fuel drop");
    expect(tripLabel("0926-04", "en")).toBe("Jaipur → Delhi (Okhla), 26 Sep: 38 L · Stationary fuel drop");
    expect(tripLabel("0926-04", "hi")).toBe("जयपुर → दिल्ली (ओखला), 26 सितंबर: 38 लीटर · खड़े ट्रक में डीज़ल घटा");
  });

  it("gives the rule alone for a flag with no litres, and the route and day for a clean trip", () => {
    expect(tripLabel("0909-07", "en")).toBe("Bhiwandi → Jaipur, 9 Sep: Toll mismatch");
    expect(tripLabel("0909-07", "hi")).toBe("भिवंडी → जयपुर, 9 सितंबर: टोल में फ़र्क");
    expect(tripLabel("0926-07", "en")).toBe("Jaipur → Ahmedabad, 26 Sep");
    expect(tripLabel("0926-07", "hi")).toBe("जयपुर → अहमदाबाद, 26 सितंबर");
  });

  it("puts the plate first on request", () => {
    expect(tripLabel("0927-02", "en", true)).toBe("RJ14 GA 1182 · Ahmedabad → Jaipur, 27 Sep: 50 L · Refuel mismatch");
  });
});

describe("citeLabels", () => {
  it("drops the plate when every cite is the same truck", () => {
    const labels = citeLabels(["0926-11", "0917-06", "0909-03"], "en").map((c) => c.label);
    expect(labels).toEqual([
      "Jaipur → Bhiwandi, 26 Sep: 39 L · Excess consumption",
      "Jaipur → Bhiwandi, 17 Sep: 48 L · Excess consumption",
      "Jaipur → Ahmedabad, 9 Sep: 38 L · Excess consumption",
    ]);
    expect(new Set(labels).size).toBe(3);
  });

  it("keeps the plate when the cites span trucks", () => {
    expect(citeLabels(["0926-04", "0927-02"], "hi")).toEqual([
      { tripId: "0926-04", label: "RJ14 GB 4521 · जयपुर → दिल्ली (ओखला), 26 सितंबर: 38 लीटर · खड़े ट्रक में डीज़ल घटा" },
      { tripId: "0927-02", label: "RJ14 GA 1182 · अहमदाबाद → जयपुर, 27 सितंबर: 50 लीटर · बिल और टंकी में फ़र्क" },
    ]);
  });
});

describe("dayLabel", () => {
  it("reads a day key in either language", () => {
    expect(dayLabel("2026-09-27")).toBe("27 Sep");
    expect(dayLabel("2026-09-27", "hi")).toBe("27 सितंबर");
  });
});

describe("STATUS_LABEL (DES-22)", () => {
  it("never reuses a confidence word, so a status can't read as a confidence", () => {
    for (const s of Object.values(STATUS_LABEL))
      for (const c of Object.values(CONFIDENCE_WORD)) {
        expect(s.hi).not.toContain(c.hi);
        expect(s.en.toLowerCase()).not.toContain(c.en.toLowerCase());
      }
    expect(STATUS_LABEL.confirmed.hi).toBe("आपने माना");
  });
});
