import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import type { ProductSummary } from "@/features/catalog/types/product";
import type { StorefrontProductCard } from "../types/merch";
import { readSellingPrice } from "@/features/catalog/utils/priceSummary";

export function merchCardToSummary(
  card: StorefrontProductCard,
  currencyFallback: string,
): ProductSummary | null {
  const slug = card.slug?.trim();
  if (!slug) return null;

  const summary = card.priceSummary ?? {};
  const price = readSellingPrice(
    summary,
    summary.price ?? summary.amount ?? summary.unitPrice,
  );
  const currency =
    (typeof summary.currencyCode === "string" && summary.currencyCode.trim()) ||
    currencyFallback;

  const gallery = (card.images ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => resolveCatalogImageUrl(img.url))
    .filter((url): url is string => Boolean(url));
  const primary = resolveCatalogImageUrl(card.image);
  const imageUrls = [...new Set(primary ? [primary, ...gallery] : gallery)];

  return {
    id: card.productId,
    slug,
    title: card.name,
    subtitle: card.shortDescription ?? undefined,
    price,
    currency,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    sku: card.sku ?? undefined,
    variantId: card.variantId ?? undefined,
    isSellable: card.isSellable && price != null,
    isVisible: card.isVisible,
    sellabilityStatus: card.sellabilityStatus ?? undefined,
    blockReasons: card.blockReasons,
    tags: Array.isArray(card.tags) ? card.tags : undefined,
  };
}
