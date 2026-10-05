import { describe, expect, it } from "vitest";
import { day, fleetNow, yesterday } from "../aggregates";
import { formatINR } from "@/lib/format";
import {
  cleanCopy,
  cleanTitle,
  emptyCopy,
  errorCopy,
  loadingStatus,
  ordinal,
  stateSpecimens,
} from "./states";

/** Rich segments → the text a reader sees. */
const text = (parts: readonly { text: string }[]) => parts.map((p) => p.text).join("");

describe("stateSpecimens (golden, final/states.html with computed numbers)", () => {
  const s = stateSpecimens();

  it("loading: 11 of 17 done, the 6 Udaipur trips still to check", () => {
    expect(s.loading.tag).toBe("reconciling yesterday’s trips");
    expect(s.loading.status.lead).toBe("Checking 17 trips against fuel, FASTag and GPS · ");
    expect(s.loading.status.done).toBe("11 of 17 done");
    // one tick per trip: 0–10 checked (lit), 11–16 still to check (dim)
    expect(s.loading.rail).toEqual({
      total: 16,
      step: 1,
      segs: [{ from: 11, to: 16, s: "stop" }],
      label: "Progress: 11 of 17 trips checked, 6 still to check",
    });
  });

  it("empty: the computed now-counts (§4.9), not the mockup's 9 / 15", () => {
    expect(s.empty.tag).toBe("no trips finished yesterday");
    expect(s.empty.title).toBe("No trips finished yesterday.");
    expect(s.empty.copy).toBe(
      "11 trucks are still on the road and 13 were in the yard or workshop. Urja will reconcile each trip the morning after it ends. Next brief: tomorrow, 7:00 AM.",
    );
    expect(s.empty.fleet).toEqual({ text: "See where trucks are now", href: "/?view=fleet" });
    expect(s.empty.september).toEqual({ text: "Open September so far", href: "/#month-h" });
  });

  it("clean: 24 Sep, all 17 trips add up, ₹1,94,800, the 4th clean day", () => {
    expect(s.clean.dayKey).toBe("2026-09-24");
    expect(s.clean.tag).toBe("a clean day · Thu 24 Sep");
    expect(s.clean.title.inr).toBe(194_800);
    expect(`${s.clean.title.before}${formatINR(s.clean.title.inr)}${s.clean.title.after}`).toBe(
      "All 17 trips add up. ₹1,94,800 earned, nothing unaccounted.",
    );
    expect(text(s.clean.copy)).toBe("Diesel, tolls and km matched on every trip. That’s the 4th clean day this month.");
    expect(s.clean.copy.find((p) => p.bold)?.text).toBe("4th clean day");
    expect(s.clean.rail).toEqual({ total: 16, step: 1, segs: [], label: "All 17 of 17 trips checked, and every one adds up" });
    expect(s.clean.ends).toEqual(["17 trips reconciled", "0 flags"]);
    expect(s.clean.ledger.text).toBe("See the ledger");
    expect(s.clean.ledger.href).toMatch(/^\/trips\/\d{4}-\d\d#led-h$/);
  });

  it("error: the 6 Udaipur trips are late; the other 11 are ready", () => {
    expect(s.error.tag).toBe("data didn’t arrive");
    expect(s.error.title).toBe("Yesterday’s trips haven’t reached Urja yet.");
    expect(s.error.copy).toBe(
      "6 trucks haven’t sent data since 2 AM, most likely no mobile network on the Udaipur stretch. Nothing is lost: the devices store data and send it when they reconnect. The other 11 trips are ready.",
    );
    expect(s.error.ready).toBe("Show the 11 ready trips");
    expect(s.error.retry).toBe("Try again");
  });

  it("every number comes from the data", () => {
    const y = yesterday();
    const now = fleetNow().counts;
    const clean = day(s.clean.dayKey);
    expect(y.trips).toBe(17);
    expect(y.udaipurTrips).toBe(6);
    expect(now.moving).toBe(11);
    expect(now.yard + now.workshop).toBe(13);
    expect(clean.flags).toHaveLength(0);
    expect(clean.profitInr).toBe(s.clean.title.inr);
    expect(clean.tripIds.map((id) => `/trips/${id}#led-h`)).toContain(s.clean.ledger.href);
  });
});

describe("specimen text builders", () => {
  it("ordinal", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th",
    ]);
  });

  it("loadingStatus handles one trip", () => {
    expect(loadingStatus(1, 0)).toEqual({ lead: "Checking 1 trip against fuel, FASTag and GPS · ", done: "0 of 1 done" });
  });

  it("cleanTitle and cleanCopy handle one trip and the first clean day", () => {
    expect(cleanTitle(1, 500).before).toBe("Yesterday’s trip adds up. ");
    expect(text(cleanCopy(1, 1))).toBe("Diesel, tolls and km matched on the trip. That’s the 1st clean day this month.");
  });

  it("emptyCopy handles singular counts", () => {
    expect(emptyCopy(1, 1, "7:00 AM")).toBe(
      "1 truck is still on the road and 1 was in the yard or workshop. Urja will reconcile each trip the morning after it ends. Next brief: tomorrow, 7:00 AM.",
    );
  });

  it("errorCopy handles one late truck and one ready trip", () => {
    expect(errorCopy(1, "2 AM", "Udaipur stretch", 1)).toBe(
      "1 truck hasn’t sent data since 2 AM, most likely no mobile network on the Udaipur stretch. Nothing is lost: the devices store data and send it when they reconnect. The other trip is ready.",
    );
  });
});
