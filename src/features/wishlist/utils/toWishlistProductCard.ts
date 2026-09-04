import type { ProductCardModel } from "@/features/home/components/ProductCard";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import type { StorefrontWishlistProductSummaryView } from "../types/wishlist";

function parseMoney(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function wishlistPrice(product: StorefrontWishlistProductSummaryView): {
  price: number | null;
  currency: string;
} {
  const summary = product.priceSummary;
  const currency =
    (typeof summary?.currencyCode === "string" && summary.currencyCode.trim()) ||
    product.currency?.trim() ||
    "AED";
  const hasValidPrice = summary?.hasValidPrice !== false;
  const price = hasValidPrice ? parseMoney(summary?.price) : null;
  return { price, currency };
}

export function toWishlistProductCard(
  product: StorefrontWishlistProductSummaryView,
): ProductCardModel | null {
  if (!product.slug) return null;
  const image = resolveCatalogImageUrl(product.image);
  const { price, currency } = wishlistPrice(product);
  return {
    id: product.productId,
    name: product.name,
    family: product.sku || "Swiss Arabian",
    price,
    image,
    images: image ? [image] : [],
    slug: product.slug,
    currency,
    variantId: product.variantId ?? undefined,
    sku: product.sku ?? undefined,
  };
}
