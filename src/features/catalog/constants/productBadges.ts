import { CATALOG_PRODUCTS } from "./catalogProducts";

export type ProductBadge = "New" | "Best Seller";

/** Heritage “01” line — treated as new launches until a live flag exists. */
const NEW_SLUGS = new Set([
  "patchouli-01",
  "incense-01",
  "tobacco-01",
  "rose-01",
  "vanilla-01",
]);

const BEST_SELLER_SALES = 1000;
const NO_BADGE = new Set(["shaghaf-oud-ahmar"]);

/** One badge per card. Best Seller wins when both apply. */
export function badgeForProduct(slug: string): ProductBadge | null {
  if (NO_BADGE.has(slug)) return null;
  const sales = CATALOG_PRODUCTS.find((product) => product.slug === slug)?.sales ?? 0;
  if (sales >= BEST_SELLER_SALES) return "Best Seller";
  if (NEW_SLUGS.has(slug)) return "New";
  return null;
}
