// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import { ICON_PATHS, IconSprite, MARK_PATHS } from "./IconSprite";

// TSK-03.2: icons.js becomes one sprite in the root layout plus <Icon name="…"/>.
const iconsJs = readFileSync(
  path.resolve(__dirname, "../../.design/exploration/final/icons.js"),
  "utf8",
);
const mockupIcons = Object.fromEntries(
  [...iconsJs.matchAll(/^\s{4}(\w+): '(.*)',$/gm)].map((m) => [m[1], m[2]]),
);
const mockupMark = /<symbol id="i-mark" viewBox="0 0 26 26">(.*?)<\/symbol>/.exec(iconsJs)![1];

describe("IconSprite", () => {
  it("carries every icons.js path, unchanged", () => {
    expect(Object.keys(mockupIcons).length).toBe(25);
    expect(ICON_PATHS).toEqual(mockupIcons);
    expect(MARK_PATHS).toBe(mockupMark);
  });

  it("renders one hidden sprite with a symbol per icon plus the mark", () => {
    const { container } = render(<IconSprite />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    const sprite = svgs[0];
    expect(sprite.getAttribute("aria-hidden")).toBe("true");
    expect(sprite.getAttribute("style")).toMatch(/position:\s*absolute/);
    expect(sprite.getAttribute("style")).toMatch(/width:\s*0/);
    const symbols = [...sprite.querySelectorAll("symbol")];
    expect(symbols.map((s) => s.id)).toEqual([
      ...Object.keys(mockupIcons).map((k) => `i-${k}`),
      "i-mark",
    ]);
    for (const s of symbols.slice(0, -1)) expect(s.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(symbols.at(-1)!.getAttribute("viewBox")).toBe("0 0 26 26");
    expect(sprite.querySelector("#i-search")!.innerHTML).toBe(
      '<circle cx="11" cy="11" r="7.5"></circle><path d="m20.5 20.5-4.3-4.3"></path>',
    );
  });
});

describe("Icon", () => {
  it("uses the sprite symbol with the mockup's svg.i class", () => {
    const { container } = render(<Icon name="truck" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toBe("i");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelector("use")!.getAttribute("href")).toBe("#i-truck");
  });

  it("appends extra classes", () => {
    const { container } = render(<Icon name="menu" className="big" />);
    expect(container.querySelector("svg")!.getAttribute("class")).toBe("i big");
  });
});
