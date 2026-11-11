import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";

/**
 * Link previews (WhatsApp, iMessage, Facebook, LinkedIn, X) read og:image.
 * Our images are WebP, which several apps do not show, and without width /
 * height WhatsApp often shows only a small thumbnail. So og:image points to
 * /api/share-image, which serves a JPEG at a fixed size: square for products
 * (like Shopify's 1200×1200), wide (1200×630) for everything else.
 */

export type ShareShape = "square" | "wide";

export const SHARE_IMAGE_SIZES: Record<
  ShareShape,
  { width: number; height: number }
> = {
  square: { width: 1200, height: 1200 },
  wide: { width: 1200, height: 630 },
};

export const SHARE_IMAGE_PATH = "/api/share-image";

/** Only our own image hosts (and local /assets) can be turned into share images. */
export function isAllowedShareSource(src: string): boolean {
  const value = src.trim();
  // Local files: only the site's own image folder (never other routes).
  if (value.startsWith("/") && !value.startsWith("//")) {
    return /^\/assets\/[^?#]+\.(png|jpe?g|webp|gif)$/i.test(value);
  }
  return isOptimizableImageSrc(value);
}

/** og:image entry for an image: the JPEG share version with its exact size. */
export function shareImageFor(
  src: string | null | undefined,
  shape: ShareShape,
  alt: string,
): {
  url: string;
  width: number;
  height: number;
  type: string;
  alt: string;
} | null {
  const value = src?.trim();
  if (!value || !isAllowedShareSource(value)) return null;
  const { width, height } = SHARE_IMAGE_SIZES[shape];
  const url = `${SHARE_IMAGE_PATH}?${new URLSearchParams({ src: value, shape }).toString()}`;
  return { url, width, height, type: "image/jpeg", alt };
}
