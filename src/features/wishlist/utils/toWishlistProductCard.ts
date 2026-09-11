import type { ProductCardModel } from "@/features/home/components/ProductCard";
import {
  CATALOG_PRODUCTS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
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

/**
 * Wishlist summary → the catalog card model, so saved items render with the
 * exact card used on the products page. The wishlist API has no subtitle, so
 * known products borrow the static catalog's eyebrow text.
 */
export function toWishlistCatalogProduct(
  product: StorefrontWishlistProductSummaryView,
): CatalogProduct | null {
  if (!product.slug) return null;
  const image = resolveCatalogImageUrl(product.image);
  const { price, currency } = wishlistPrice(product);
  const known = CATALOG_PRODUCTS.find((p) => p.slug === product.slug);
  return toCatalogProduct({
    id: product.productId,
    slug: product.slug,
    title: product.name,
    subtitle: known?.subtitle,
    price,
    currency,
    imageUrl: image,
    imageUrls: image ? [image] : [],
    sku: product.sku ?? undefined,
    variantId: product.variantId ?? undefined,
    isSellable: product.isSellable,
    isVisible: product.isVisible,
    sellabilityStatus: product.sellabilityStatus ?? undefined,
  });
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
