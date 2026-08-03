import { apiGet } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type { ProductDetail, ProductSummary } from "../types/product";

export const catalogKeys = {
  all: ["catalog"] as const,
  list: (zoneCode?: string | null) =>
    [...catalogKeys.all, "list", zoneCode ?? "default"] as const,
  detail: (slug: string, zoneCode?: string | null) =>
    [...catalogKeys.all, "detail", slug, zoneCode ?? "default"] as const,
};

type ApiPriceSummary = {
  /** Backend may send numeric strings, e.g. `"60"`. */
  price: number | string | null;
  currencyCode?: string | null;
  hasValidPrice?: boolean;
};

type ApiInventorySummary = {
  availableQty?: number | string | null;
  hasAvailableInventory?: boolean;
};

type ApiCatalogProduct = {
  productId: string;
  variantId: string;
  sku?: string | null;
  slug: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  image?: string | null;
  priceSummary?: ApiPriceSummary | null;
  inventorySummary?: ApiInventorySummary | null;
  isVisible?: boolean;
  isSellable?: boolean;
  sellabilityStatus?: string | null;
  blockReasons?: string[] | null;
};

type ApiProductListData = {
  products: ApiCatalogProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function parseMoney(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function mapProduct(raw: ApiCatalogProduct): ProductDetail {
  const currency = raw.priceSummary?.currencyCode?.trim() || "AED";
  const hasValidPrice = raw.priceSummary?.hasValidPrice !== false;
  const price = hasValidPrice ? parseMoney(raw.priceSummary?.price) : null;
  const availableQty = parseMoney(raw.inventorySummary?.availableQty);
  const sellabilityStatus = raw.sellabilityStatus ?? undefined;
  const inStock =
    raw.inventorySummary?.hasAvailableInventory === true ||
    (availableQty != null && availableQty > 0);

  return {
    id: raw.productId,
    slug: raw.slug,
    title: raw.name,
    subtitle: raw.shortDescription ?? raw.sku ?? undefined,
    description:
      raw.description?.trim() ||
      raw.shortDescription?.trim() ||
      "Product details will appear once the catalog is fully refreshed.",
    price,
    currency,
    imageUrl: raw.image ?? null,
    sku: raw.sku ?? undefined,
    variantId: raw.variantId,
    isSellable: Boolean(raw.isSellable) && price != null,
    isVisible: Boolean(raw.isVisible),
    sellabilityStatus,
    inStock,
    availableQty: availableQty ?? undefined,
    blockReasons: raw.blockReasons ?? undefined,
  };
}

function contextQs(zoneCode?: string | null) {
  return storefrontContextQuery({ zoneCode });
}

export async function fetchProducts(
  zoneCode?: string | null,
  options?: { page?: number; limit?: number },
): Promise<ProductSummary[]> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 24;
  const qs = `${contextQs(zoneCode)}&page=${page}&limit=${limit}`;
  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/products?${qs}`,
    { skipAuth: true },
  );
  return (data.products ?? []).map(mapProduct);
}

export async function fetchProductBySlug(
  slug: string,
  zoneCode?: string | null,
): Promise<ProductDetail | null> {
  const qs = contextQs(zoneCode);

  // Prefer list/sku lookup — detail route 404s for non-visible products today.
  try {
    const bySku = await apiGet<ApiProductListData>(
      `/storefront/catalog/products?${qs}&sku=${encodeURIComponent(slug)}&limit=1`,
      { skipAuth: true },
    );
    const hit = bySku.products?.[0];
    if (hit) return mapProduct(hit);
  } catch {
    // continue
  }

  try {
    const data = await apiGet<ApiCatalogProduct>(
      `/storefront/catalog/products/${encodeURIComponent(slug)}?${qs}`,
      { skipAuth: true },
    );
    return mapProduct(data);
  } catch {
    // continue
  }

  try {
    const bySearch = await apiGet<ApiProductListData>(
      `/storefront/catalog/search?${qs}&q=${encodeURIComponent(slug)}&limit=5`,
      { skipAuth: true },
    );
    const hit =
      bySearch.products?.find(
        (p) => p.slug === slug || p.sku === slug || p.productId === slug,
      ) ?? bySearch.products?.[0];
    if (hit) return mapProduct(hit);
  } catch {
    // continue
  }

  return null;
}
