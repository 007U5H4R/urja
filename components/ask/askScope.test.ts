import { describe, expect, it } from "vitest";
import { SAVED_MESSAGE } from "@/lib/ask/fallback";
import { getAskContext } from "@/lib/ask/context";
import { askShellData } from "./askScope";

describe("askShellData (the provenance scope, from the data)", () => {
  it("is '212 trips across 24 trucks, 1–27 Sep', the same scope the API returns", () => {
    const d = askShellData();
    expect(d.scope).toBe("212 trips across 24 trucks, 1–27 Sep");
    expect(d.scope).toBe(getAskContext().scope);
    expect(d.saved).toEqual(SAVED_MESSAGE);
  });
});
