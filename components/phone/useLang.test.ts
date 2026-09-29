import { describe, expect, it } from "vitest";
import { langOf } from "./useLang";

describe("langOf", () => {
  it("reads ?lang= with Hindi as the default, a repeated value by its last one (as the server does)", () => {
    const q = (s: string) => new URLSearchParams(s);
    expect(langOf(null)).toBe("hi");
    expect(langOf(q(""))).toBe("hi");
    expect(langOf(q("lang=en"))).toBe("en");
    expect(langOf(q("lang=fr"))).toBe("hi");
    expect(langOf(q("lang=en&lang=hi"))).toBe("hi");
    expect(langOf(q("lang=hi&lang=en"))).toBe("en");
    expect(langOf(q("only=high&lang=en"))).toBe("en");
  });
});
