import { describe, expect, it } from "vitest";
import { SAVED_MESSAGE } from "@/lib/ask/fallback";
import { getAskContext } from "@/lib/ask/context";
import { askShellData } from "./askScope";

describe("askShellData (the provenance scope, from the data)", () => {
  it("is '212 trips across 24 trucks, 1–27 Sep', the same scope the API returns", () => {
    const d = askShellData();
    expect(d.scope.en).toBe("212 trips across 24 trucks, 1–27 Sep");
    expect(d.scope.en).toBe(getAskContext().scope);
    expect(d.saved).toEqual(SAVED_MESSAGE);
  });

  it("has the Hindi scope for the Hindi drawer (EXE23), from the same numbers", () => {
    expect(askShellData().scope.hi).toBe("212 ट्रिप, 24 ट्रक, 1–27 सितंबर");
  });
});
