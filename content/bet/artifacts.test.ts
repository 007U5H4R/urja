import { describe, expect, it } from "vitest";
import { ARTIFACTS, ARTIFACTS_ACCESS, ARTIFACTS_ALLOWED_HOSTS, ARTIFACTS_NOTE } from "./artifacts";

// TASK-32 (EXE49): /bet/artifacts lists the deliverables, one line each, with a safe link.
// TASK-34 (EXE50): a seventh card, the pitch script.

describe("TASK-32 · artifacts", () => {
  it("lists the seven deliverables in order", () => {
    expect(ARTIFACTS.map((a) => a.title)).toEqual([
      "Strategy doc",
      "PRD",
      "Slide deck",
      "Pitch script",
      "Research report",
      "Bet spec",
      "Decisions log",
    ]);
    expect(new Set(ARTIFACTS.map((a) => a.id)).size).toBe(7);
  });

  it("TASK-34: the pitch script card links its Claude artifact and opens if shared", () => {
    expect(ARTIFACTS.find((a) => a.id === "pitch-script")).toMatchObject({
      title: "Pitch script",
      description: "The 20-minute talk track, the demo click by click, and the hard questions.",
      href: "https://claude.ai/code/artifact/d78dfca4-4bb6-4699-8c9e-94df6b5f7d70",
      access: "shared",
    });
  });

  it("every link is https on an allowed host", () => {
    expect([...ARTIFACTS_ALLOWED_HOSTS]).toEqual(["claude.ai", "github.com"]);
    for (const a of ARTIFACTS) {
      const url = new URL(a.href);
      expect(url.protocol, a.id).toBe("https:");
      expect(ARTIFACTS_ALLOWED_HOSTS, a.id).toContain(url.hostname);
      expect(url.username + url.password, a.id).toBe("");
    }
  });

  it("claude.ai links open if shared; GitHub links are public", () => {
    for (const a of ARTIFACTS) {
      const host = new URL(a.href).hostname;
      expect(a.access, a.id).toBe(host === "claude.ai" ? "shared" : "public");
    }
    expect(ARTIFACTS_ACCESS).toEqual({ shared: "Opens if shared with you", public: "Public" });
    expect(ARTIFACTS.filter((a) => a.access === "shared")).toHaveLength(4);
  });

  it("each card has a one-line description and a format", () => {
    for (const a of ARTIFACTS) {
      expect(a.description.trim(), a.id).not.toBe("");
      expect(a.description, a.id).not.toMatch(/\n/);
      expect(a.format.trim(), a.id).not.toBe("");
    }
    expect(ARTIFACTS.find((a) => a.id === "research")?.description).toBe("110 sources, mostly snippet-level and unverified.");
  });

  it("the page's note points at the research report instead of a source list", () => {
    expect(ARTIFACTS_NOTE.text).toBe("Research figures are unverified; see the research report.");
    expect(ARTIFACTS_NOTE.href).toBe(ARTIFACTS.find((a) => a.id === "research")?.href);
  });

  it("uses no accusing word", () => {
    expect(JSON.stringify(ARTIFACTS)).not.toMatch(/\b(theft|stolen|steal|thief)\b|चोरी|चुरा/i);
  });
});
