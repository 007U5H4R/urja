import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TC-060 / TC-061: no Google API key and no .env file is ever tracked.
// The pattern is assembled from pieces so this file never matches itself.
const GOOGLE_KEY = new RegExp(["AI", "za", "[0-9A-Za-z_\\-]{35}"].join(""));

const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".bmp",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".pdf", ".zip", ".gz", ".tgz", ".br", ".zst",
  ".mp3", ".mp4", ".webm", ".mov", ".wav",
  ".glb", ".bin", ".pbf", ".mbtiles",
]);

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

function trackedFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" });
  return out.split("\0").filter(Boolean);
}

function readText(rel: string): string | null {
  if (BINARY_EXT.has(path.extname(rel).toLowerCase())) return null;
  const abs = path.join(root, rel);
  let stat;
  try {
    stat = statSync(abs);
  } catch {
    return null; // tracked but deleted in the working tree
  }
  if (!stat.isFile()) return null;
  const buf = readFileSync(abs);
  if (buf.includes(0)) return null; // NUL byte: binary
  return buf.toString("utf8");
}

describe("secret scan", () => {
  const files = trackedFiles();

  it("sees the tracked files", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("package.json");
  });

  it("tracks no Google API key", () => {
    const hits = files.filter((rel) => {
      const text = readText(rel);
      return text !== null && GOOGLE_KEY.test(text);
    });
    expect(hits).toEqual([]);
  });

  it("does not track .env files", () => {
    const envFiles = files.filter((rel) => {
      const base = path.basename(rel);
      return base === ".env" || (base.startsWith(".env.") && base !== ".env.example");
    });
    expect(envFiles).toEqual([]);
  });
});
