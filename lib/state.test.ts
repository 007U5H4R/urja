import { describe, expect, it } from "vitest";
import { DATA_STATES, TRIP_STATES, parseState } from "./state";

describe("parseState", () => {
  it("reads ?state= from a plain searchParams object (a server page's props)", () => {
    expect(parseState({ state: "loading" }, DATA_STATES)).toBe("loading");
    expect(parseState({ state: "empty" }, DATA_STATES)).toBe("empty");
    expect(parseState({ state: "clean" }, DATA_STATES)).toBe("clean");
    expect(parseState({ state: "error" }, DATA_STATES)).toBe("error");
  });

  it("reads ?state= from URLSearchParams (a client read of location.search)", () => {
    expect(parseState(new URLSearchParams("?state=error&lang=en"), DATA_STATES)).toBe("error");
    expect(parseState(new URLSearchParams("?lang=en"), DATA_STATES)).toBeNull();
  });

  it("takes the first value when the param repeats", () => {
    expect(parseState({ state: ["clean", "error"] }, DATA_STATES)).toBe("clean");
    expect(parseState(new URLSearchParams("?state=clean&state=error"), DATA_STATES)).toBe("clean");
  });

  it("lets unknown, empty or missing values fall through to the normal view (null)", () => {
    expect(parseState({ state: "foo" }, DATA_STATES)).toBeNull();
    expect(parseState({ state: "" }, DATA_STATES)).toBeNull();
    expect(parseState({ state: "LOADING" }, DATA_STATES)).toBeNull();
    expect(parseState({ state: undefined }, DATA_STATES)).toBeNull();
    expect(parseState({}, DATA_STATES)).toBeNull();
    expect(parseState({ state: [] }, DATA_STATES)).toBeNull();
    expect(parseState(null, DATA_STATES)).toBeNull();
    expect(parseState(undefined, DATA_STATES)).toBeNull();
  });

  it("allows only the states a route supports (Trip: loading and error)", () => {
    expect(TRIP_STATES).toEqual(["loading", "error"]);
    expect(parseState({ state: "loading" }, TRIP_STATES)).toBe("loading");
    expect(parseState({ state: "error" }, TRIP_STATES)).toBe("error");
    expect(parseState({ state: "empty" }, TRIP_STATES)).toBeNull();
    expect(parseState({ state: "clean" }, TRIP_STATES)).toBeNull();
  });

  it("does not match inherited object keys", () => {
    expect(parseState({ state: "toString" }, DATA_STATES)).toBeNull();
    expect(parseState({ state: "constructor" }, DATA_STATES)).toBeNull();
  });
});
