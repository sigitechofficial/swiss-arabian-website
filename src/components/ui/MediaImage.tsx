import Image, { type ImageProps } from "next/image";
import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";

export type MediaImageProps = Omit<ImageProps, "src"> & { src: string };

/**
 * `next/image` for media whose URL comes from data (catalog, CMS, orders).
 * Hosts allowed in `remoteImagePatterns.ts` are optimized; any other URL is
 * served as-is instead of failing, so a new media host never breaks a page.
 */
export function MediaImage({ src, unoptimized, alt, ...props }: MediaImageProps) {
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? !isOptimizableImageSrc(src)}
    />
  );
}
