import { describe, expect, it } from "vitest";
import { driverFirstName, langParam, town } from "./dict";

describe("lib/brief/dict", () => {
  it("reads ?lang= with Hindi as the default", () => {
    expect(langParam(undefined)).toBe("hi");
    expect(langParam("hi")).toBe("hi");
    expect(langParam("en")).toBe("en");
    expect(langParam(["en", "hi"])).toBe("en");
    expect(langParam("fr")).toBe("hi");
  });

  it("names a pump or depot by its town, in both languages", () => {
    expect([town("kishangarh-pump", "en"), town("kishangarh-pump", "hi")]).toEqual(["Kishangarh", "किशनगढ़"]);
    expect([town("okhla", "en"), town("okhla", "hi")]).toEqual(["Delhi", "दिल्ली"]);
    expect([town("bhiwandi", "en"), town("bhiwandi", "hi")]).toEqual(["Bhiwandi", "भिवंडी"]);
    expect(town("neemrana-hp", "hi")).toBe("नीमराना");
  });

  it("gives the driver's first name from the fleet", () => {
    expect([driverFirstName("RJ14 GB 4521", "en"), driverFirstName("RJ14 GB 4521", "hi")]).toEqual(["Ramesh", "रमेश"]);
  });
});
