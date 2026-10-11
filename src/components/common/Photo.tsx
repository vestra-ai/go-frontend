import Image, { type ImageProps } from "next/image";
import type { Ref } from "react";
import { isOptimizable } from "@/lib/imageHosts";

type PhotoProps = Omit<ImageProps, "src" | "alt" | "sizes" | "width" | "height" | "fill" | "unoptimized"> & {
  src: string;
  alt: string;
  /** How wide the photo is on screen (`"36px"`, `"(min-width: 450px) 450px, 100vw"`): the browser picks the resized copy from it. */
  sizes: string;
  ref?: Ref<HTMLImageElement>;
};

// Only the aspect ratio hint `next/image` asks for; the photo is sized by its `className`, as the `<img>` it replaces was.
const WIDTH = 640;
const HEIGHT = 480;

/**
 * A trip's cover photo. One on the Server's image host goes through Next's optimizer (a resized WebP at the width on
 * screen instead of the ~600 KB original); any other source (an SVG illustration, another host, a data URL) renders
 * as it is. Unlike a plain `<img>` it loads lazily: pass `loading="eager"` for what is on screen at first paint.
 */
export function Photo({ src, alt, sizes, ...props }: PhotoProps) {
  return <Image src={src} alt={alt} sizes={sizes} width={WIDTH} height={HEIGHT} unoptimized={!isOptimizable(src)} {...props} />;
}
