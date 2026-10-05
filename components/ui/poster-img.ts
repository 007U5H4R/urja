import { getImgProps } from "next/dist/shared/lib/get-img-props";
import type { ImageConfigComplete } from "next/dist/shared/lib/image-config";
import defaultLoader from "next/dist/shared/lib/image-loader";
import type { CSSProperties, ImgHTMLAttributes } from "react";

export type PosterImgProps = ImgHTMLAttributes<HTMLImageElement>;

/**
 * The truck poster as plain `<img>` props, computed on the server (M-004 perf, EXE18): the markup
 * `<Image src fill preload sizes>` rendered (same optimised srcSet, sizes, style and data-nimg),
 * without shipping next/image's client component. The `<link rel="preload" as="image">` still comes
 * with it: React's server renderer preloads an eager `<img srcset>` in the shell by itself.
 * That component is a client reference even when a server component renders it, so Today and
 * Why Urja each loaded ~5 KB of image code (a separate request on /why) for a poster that never
 * changes. `next/image`'s own `getImageProps` would pull the same client module into the graph, so
 * this calls the function it wraps (next is pinned; components/ui/poster-img.test.ts checks the
 * output still equals `getImageProps`).
 */
export function posterImg(
  src: string,
  sizes: string,
  opts: { style?: CSSProperties; fetchPriority?: "high" | "low" | "auto" } = {},
): PosterImgProps {
  const { props } = getImgProps(
    { src, alt: "", fill: true, preload: true, sizes, style: opts.style, fetchPriority: opts.fetchPriority },
    // Next inlines its images config here at build time (as getImageProps does); unset in unit tests,
    // where getImgProps falls back to the same defaults.
    { defaultLoader, imgConf: process.env.__NEXT_IMAGE_OPTS as unknown as ImageConfigComplete },
  );
  const img = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as PosterImgProps;
  return { ...img, "data-nimg": "fill" } as PosterImgProps;
}

