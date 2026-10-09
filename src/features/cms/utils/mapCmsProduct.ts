import type { ProductSummary } from "@/features/catalog/types/product";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import type { CmsProductCard } from "../types/cmsHome.types";

function parseMoney(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function galleryUrls(raw: CmsProductCard): string[] {
  const fromGallery = (raw.images ?? [])
    .filter((img) => {
      const type = img.mediaType?.trim().toUpperCase();
      return !type || type === "IMAGE";
    })
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => resolveCatalogImageUrl(img.url))
    .filter((url): url is string => Boolean(url));

  const primary = resolveCatalogImageUrl(raw.image);
  const ordered = primary
    ? [primary, ...fromGallery.filter((url) => url !== primary)]
    : fromGallery;
  return [...new Set(ordered)];
}

/** Map CMS-resolved StorefrontProductCard → storefront ProductSummary. */
export function mapCmsProduct(raw: CmsProductCard): ProductSummary | null {
  if (!raw?.productId || !raw.slug?.trim()) return null;

  const currency = raw.priceSummary?.currencyCode?.trim() || "AED";
  const hasValidPrice = raw.priceSummary?.hasValidPrice !== false;
  const price = hasValidPrice ? parseMoney(raw.priceSummary?.price) : null;
  const availableQty = parseMoney(raw.inventorySummary?.availableQty);
  const inStock =
    raw.inventorySummary?.hasAvailableInventory === true ||
    (availableQty != null && availableQty > 0);
  const imageUrls = galleryUrls(raw);

  return {
    id: raw.productId,
    slug: raw.slug.trim(),
    title: raw.name,
    subtitle: raw.shortDescription?.trim() || raw.sku || undefined,
    price,
    currency,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    sku: raw.sku ?? undefined,
    variantId: raw.variantId ?? undefined,
    isSellable: Boolean(raw.isSellable) && price != null,
    isVisible: Boolean(raw.isVisible),
    sellabilityStatus: raw.sellabilityStatus ?? undefined,
    inStock,
    availableQty: availableQty ?? undefined,
    blockReasons: raw.blockReasons,
    tags: Array.isArray(raw.tags) ? raw.tags : undefined,
  };
}

export function mapCmsProducts(raw: unknown): ProductSummary[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductSummary[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const mapped = mapCmsProduct(item as CmsProductCard);
    if (mapped) out.push(mapped);
  }
  return out;
}
