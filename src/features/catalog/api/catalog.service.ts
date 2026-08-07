import { apiGet } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type { ProductDetail, ProductSummary } from "../types/product";
import { resolveCatalogImageUrl } from "../utils/resolveCatalogImageUrl";

export const CATALOG_PAGE_SIZE = 24;

export type CatalogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListResult = {
  products: ProductSummary[];
  pagination: CatalogPagination;
};

export const catalogKeys = {
  all: ["catalog"] as const,
  list: (zoneCode?: string | null, page = 1, limit = CATALOG_PAGE_SIZE) =>
    [...catalogKeys.all, "list", zoneCode ?? "default", page, limit] as const,
  infinite: (zoneCode?: string | null, limit = CATALOG_PAGE_SIZE) =>
    [...catalogKeys.all, "infinite", zoneCode ?? "default", limit] as const,
  detail: (slug: string, zoneCode?: string | null) =>
    [...catalogKeys.all, "detail", slug, zoneCode ?? "default"] as const,
  collections: (zoneCode?: string | null) =>
    [...catalogKeys.all, "collections", zoneCode ?? "default"] as const,
  collection: (slug: string, zoneCode?: string | null) =>
    [...catalogKeys.all, "collection", slug, zoneCode ?? "default"] as const,
  collectionProducts: (
    slug: string,
    zoneCode?: string | null,
    page = 1,
    limit = CATALOG_PAGE_SIZE,
  ) =>
    [
      ...catalogKeys.all,
      "collection-products",
      slug,
      zoneCode ?? "default",
      page,
      limit,
    ] as const,
  collectionInfinite: (
    slug: string,
    zoneCode?: string | null,
    limit = CATALOG_PAGE_SIZE,
  ) =>
    [
      ...catalogKeys.all,
      "collection-infinite",
      slug,
      zoneCode ?? "default",
      limit,
    ] as const,
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
    imageUrl: resolveCatalogImageUrl(raw.image),
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

function normalizePagination(
  raw: ApiProductListData["pagination"] | undefined,
  page: number,
  limit: number,
  productCount: number,
): CatalogPagination {
  const total = Math.max(0, Number(raw?.total ?? productCount) || productCount);
  const resolvedLimit = Math.max(1, Number(raw?.limit ?? limit) || limit);
  const resolvedPage = Math.max(1, Number(raw?.page ?? page) || page);
  const totalPages = Math.max(
    1,
    Number(raw?.totalPages) || Math.ceil(total / resolvedLimit) || 1,
  );
  return {
    page: resolvedPage,
    limit: resolvedLimit,
    total,
    totalPages,
  };
}

export async function fetchProducts(
  zoneCode?: string | null,
  options?: { page?: number; limit?: number },
): Promise<ProductListResult> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, options?.limit ?? CATALOG_PAGE_SIZE);
  const qs = `${contextQs(zoneCode)}&page=${page}&limit=${limit}`;
  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/products?${qs}`,
    { skipAuth: true },
  );
  const products = (data.products ?? []).map(mapProduct);
  return {
    products,
    pagination: normalizePagination(data.pagination, page, limit, products.length),
  };
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

export type CatalogCollection = {
  id: string;
  code?: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  productCount?: number;
};

type ApiCollectionListData = {
  items: CatalogCollection[];
};

export async function fetchCollections(
  zoneCode?: string | null,
): Promise<CatalogCollection[]> {
  const data = await apiGet<ApiCollectionListData>(
    `/storefront/catalog/collections?${contextQs(zoneCode)}`,
    { skipAuth: true },
  );
  return data.items ?? [];
}

export async function fetchCollectionBySlug(
  slug: string,
  zoneCode?: string | null,
): Promise<CatalogCollection | null> {
  try {
    const data = await apiGet<CatalogCollection>(
      `/storefront/catalog/collections/${encodeURIComponent(slug)}?${contextQs(zoneCode)}`,
      { skipAuth: true },
    );
    return data;
  } catch {
    return null;
  }
}

export async function fetchCollectionProducts(
  slug: string,
  zoneCode?: string | null,
  options?: { page?: number; limit?: number },
): Promise<ProductListResult> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, options?.limit ?? CATALOG_PAGE_SIZE);
  const qs = `${contextQs(zoneCode)}&page=${page}&limit=${limit}`;
  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/collections/${encodeURIComponent(slug)}/products?${qs}`,
    { skipAuth: true },
  );
  const products = (data.products ?? []).map(mapProduct);
  return {
    products,
    pagination: normalizePagination(data.pagination, page, limit, products.length),
  };
}

