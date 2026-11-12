import { optimizedImageUrl } from "@/lib/images/optimizedImageUrl";

/** Home strip cards are clamp(190px, 20vw, 260px) wide; two fit a phone screen. */
export const STRIP_IMAGE_SIZES = "(max-width: 700px) 50vw, 260px";

/** CSS width the hover ("ingredients") art is fetched for (2x of this on retina). */
const HOVER_IMAGE_WIDTH = 320;

/** The card's hover image, resized by the optimiser, or null when the product has none. */
export function hoverImageUrl(product: {
  imageUrl?: string | null;
  imageUrls?: readonly string[] | null;
}): string | null {
  const candidate = product.imageUrls?.[1];
  if (!candidate || candidate === product.imageUrl) return null;
  return optimizedImageUrl(candidate, HOVER_IMAGE_WIDTH);
}
