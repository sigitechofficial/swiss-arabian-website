import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import type { ProductSummary } from "@/features/catalog/types/product";
import type { StorefrontProductCard } from "../types/merch";

function parseMoney(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function merchCardToSummary(
  card: StorefrontProductCard,
  currencyFallback: string,
): ProductSummary | null {
  const slug = card.slug?.trim();
  if (!slug) return null;

  const summary = card.priceSummary ?? {};
  const hasValidPrice = summary.hasValidPrice !== false;
  const price = hasValidPrice
    ? parseMoney(summary.price ?? summary.amount ?? summary.unitPrice)
    : null;
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
