import { getImageProps } from "next/image";
import { isOptimizableImageSrc } from "./remoteImagePatterns";

/**
 * URL of `src` resized by the Next.js image optimiser, for places that can't
 * render `<Image>` (CSS backgrounds, `new Image()` preloads).
 *
 * `width` is the CSS width the image is shown at. The URL is sized for 2x
 * screens, the same file `<Image width={width}>` would load on them, so a
 * preload and the rendered image share one cache entry. Hosts the optimiser
 * can't serve come back unchanged.
 */
export function optimizedImageUrl(src: string, width: number, quality = 75): string {
  if (!isOptimizableImageSrc(src)) return src;
  const { props } = getImageProps({ src, alt: "", width, height: width, quality });
  return props.src ?? src;
}
