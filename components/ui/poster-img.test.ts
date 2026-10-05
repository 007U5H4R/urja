import { getImageProps } from "next/image";
import { describe, expect, it } from "vitest";
import { posterImg } from "./poster-img";

// M-004 perf (EXE18): the posters render as plain <img> props computed on the server, so neither
// Today nor Why Urja ships next/image's client component. The markup must stay what <Image fill
// preload> rendered: same src, srcSet, sizes, style, decoding and data-nimg, and never lazy.

describe("posterImg", () => {
  it("returns next/image's own props for a fill, preloaded image, plus its data-nimg marker", () => {
    const sizes = "(max-width: 1180px) 100vw, 60vw";
    const style = { objectFit: "cover", objectPosition: "30% center" } as const;
    const { props } = getImageProps({ src: "/truck-scene.png", alt: "", fill: true, preload: true, sizes, style });
    expect(posterImg("/truck-scene.png", sizes, { style })).toEqual({ ...props, "data-nimg": "fill" });
  });

  it("serves the optimised, responsive poster eagerly, with the priority it is given", () => {
    const img = posterImg("/truck-scene.png", "(max-width: 1120px) 100vw, 1056px", { fetchPriority: "high" });
    expect(img.src).toMatch(/^\/_next\/image\?url=%2Ftruck-scene\.png&w=\d+&q=75$/);
    expect(img.srcSet).toMatch(/\/_next\/image\?url=%2Ftruck-scene\.png&w=750&q=75 750w/);
    expect(img.sizes).toBe("(max-width: 1120px) 100vw, 1056px");
    expect(img.alt).toBe("");
    expect(img.loading).toBeUndefined();
    expect(img.fetchPriority).toBe("high");
  });
});
