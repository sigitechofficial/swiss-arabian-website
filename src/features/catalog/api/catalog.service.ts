import { apiGet } from "@/lib/api/apiClient";
import {
  storefrontContextQuery,
  toAuthSalesChannelCode,
} from "@/lib/storefront/context";
import type {
  ProductCollectionRef,
  ProductDetail,
  ProductSummary,
} from "../types/product";
import { sanitizeCatalogHtml, stripHtml } from "../utils/catalogHtml";
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
  detail: (slug: string, zoneCode?: string | null) =>
    [...catalogKeys.all, "detail", slug, zoneCode ?? "default"] as const,
  collections: (zoneCode?: string | null) =>
    [...catalogKeys.all, "collections", zoneCode ?? "default"] as const,
  collection: (slug: string, zoneCode?: string | null) =>
    [...catalogKeys.all, "collection", slug, zoneCode ?? "default"] as const,
  search: (
    q: string,
    zoneCode?: string | null,
    page = 1,
    limit = 20,
    sort = "newest",
  ) =>
    [
      ...catalogKeys.all,
      "search",
      q,
      zoneCode ?? "default",
      page,
      limit,
      sort,
    ] as const,
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
};

type ApiPriceSummary = {
  price: number | string | null;
  currencyCode?: string | null;
  hasValidPrice?: boolean;
};

type ApiInventorySummary = {
  availableQty?: number | string | null;
  hasAvailableInventory?: boolean;
};

type ApiProductImage = {
  url?: string | null;
  altText?: string | null;
  sortOrder?: number | null;
  mediaType?: string | null;
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
  images?: ApiProductImage[] | null;
  priceSummary?: ApiPriceSummary | null;
  inventorySummary?: ApiInventorySummary | null;
  isVisible?: boolean;
  isSellable?: boolean;
  sellabilityStatus?: string | null;
  blockReasons?: string[] | null;
};

type ApiProductDetailVariant = {
  variantId: string;
  sku?: string | null;
  variantName?: string | null;
  isDefault?: boolean;
  isVisible?: boolean;
  isSellable?: boolean;
  sellabilityStatus?: string | null;
  priceSummary?: ApiPriceSummary | null;
  inventorySummary?: ApiInventorySummary | null;
  blockReasons?: string[] | null;
};

type ApiProductDetailData = {
  product: {
    productId: string;
    productCode?: string | null;
    slug: string;
    name: string;
    shortDescription?: string | null;
    description?: string | null;
    brandCode?: string | null;
    brandName?: string | null;
  };
  variants?: ApiProductDetailVariant[] | null;
  media?: ApiProductImage[] | null;
  collections?: Array<{
    collectionId?: string;
    code?: string;
    name: string;
    slug: string;
    isFeatured?: boolean;
  }> | null;
  priceSummary?: ApiPriceSummary | null;
  inventorySummary?: ApiInventorySummary | null;
  isVisible?: boolean;
  isSellable?: boolean;
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

function mapGalleryUrls(
  images: ApiProductImage[] | null | undefined,
  primary?: string | null,
): string[] {
  const fromGallery = (images ?? [])
    .filter((img) => {
      const type = img.mediaType?.trim().toUpperCase();
      return !type || type === "IMAGE";
    })
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => resolveCatalogImageUrl(img.url))
    .filter((url): url is string => Boolean(url));

  const primaryUrl = resolveCatalogImageUrl(primary);
  const ordered = primaryUrl
    ? [primaryUrl, ...fromGallery.filter((url) => url !== primaryUrl)]
    : fromGallery;

  return [...new Set(ordered)];
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
  const imageUrls = mapGalleryUrls(raw.images, raw.image);
  const descriptionHtml = sanitizeCatalogHtml(
    raw.description || raw.shortDescription,
  );
  const descriptionPlain =
    stripHtml(raw.description) ||
    stripHtml(raw.shortDescription) ||
    "Product details will appear once the catalog is fully refreshed.";

  return {
    id: raw.productId,
    slug: raw.slug,
    title: raw.name,
    subtitle: stripHtml(raw.shortDescription) || raw.sku || undefined,
    description: descriptionPlain,
    descriptionHtml: descriptionHtml || undefined,
    price,
    currency,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
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

function pickDefaultVariant(
  variants: ApiProductDetailVariant[] | null | undefined,
): ApiProductDetailVariant | undefined {
  if (!variants?.length) return undefined;
  return (
    variants.find((v) => v.isDefault && v.isVisible !== false) ??
    variants.find((v) => v.isVisible !== false) ??
    variants[0]
  );
}

function mapProductDetail(raw: ApiProductDetailData): ProductDetail | null {
  const product = raw.product;
  if (!product?.productId || !product.slug) return null;

  const variant = pickDefaultVariant(raw.variants);
  const priceSummary = variant?.priceSummary ?? raw.priceSummary;
  const inventorySummary = variant?.inventorySummary ?? raw.inventorySummary;
  const currency = priceSummary?.currencyCode?.trim() || "AED";
  const hasValidPrice = priceSummary?.hasValidPrice !== false;
  const price = hasValidPrice ? parseMoney(priceSummary?.price) : null;
  const availableQty = parseMoney(inventorySummary?.availableQty);
  const isSellableRoot = raw.isSellable ?? variant?.isSellable;
  const sellabilityStatus = variant?.sellabilityStatus ?? undefined;
  const inStock =
    inventorySummary?.hasAvailableInventory === true ||
    (availableQty != null && availableQty > 0);
  const imageUrls = mapGalleryUrls(raw.media);
  const descriptionSource =
    product.description || product.shortDescription || "";
  const descriptionHtml = sanitizeCatalogHtml(descriptionSource);
  const descriptionPlain =
    stripHtml(product.description) ||
    stripHtml(product.shortDescription) ||
    "Product details will appear once the catalog is fully refreshed.";

  const collections: ProductCollectionRef[] = (raw.collections ?? [])
    .filter((c) => c.slug && c.name)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      isFeatured: c.isFeatured,
    }));

  const brandName = product.brandName?.trim() || undefined;
  const featuredCollection =
    collections.find((c) => c.isFeatured)?.name ?? collections[0]?.name;

  return {
    id: product.productId,
    slug: product.slug,
    title: product.name,
    subtitle: brandName || featuredCollection || variant?.sku || undefined,
    description: descriptionPlain,
    descriptionHtml: descriptionHtml || undefined,
    price,
    currency,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    sku: variant?.sku ?? undefined,
    variantId: variant?.variantId ?? product.productId,
    isSellable: Boolean(isSellableRoot) && price != null,
    isVisible: Boolean(raw.isVisible ?? true),
    sellabilityStatus,
    inStock,
    availableQty: availableQty ?? undefined,
    blockReasons: raw.blockReasons ?? variant?.blockReasons ?? undefined,
    brandName,
    collections,
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

export const CATALOG_SEARCH_PAGE_SIZE = 20;

export type CatalogSearchSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export type CatalogSearchOptions = {
  q: string;
  page?: number;
  limit?: number;
  sort?: CatalogSearchSort;
  onlySellable?: boolean;
};

/**
 * `GET /storefront/catalog/search` — public, market-scoped catalog search.
 *
 * Sends `salesChannelCode` alongside the usual context, per the search guide.
 * Callers must not pass a blank `q`: the endpoint answers it with the entire
 * catalog (474 rows), which is a dump, not a search result.
 */
export async function fetchCatalogSearch(
  zoneCode: string | null | undefined,
  options: CatalogSearchOptions,
): Promise<ProductListResult> {
  const q = options.q.trim();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? CATALOG_SEARCH_PAGE_SIZE);
  const sort = options.sort ?? "newest";
  const onlySellable = options.onlySellable !== false;

  const qs = new URLSearchParams(
    storefrontContextQuery({
      zoneCode,
      salesChannelCode: toAuthSalesChannelCode(zoneCode),
    }),
  );
  qs.set("q", q);
  qs.set("onlySellable", onlySellable ? "true" : "false");
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("sort", sort);

  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/search?${qs.toString()}`,
    { skipAuth: true },
  );
  const products = (data.products ?? []).map(mapProduct);
  const pagination = normalizePagination(
    data.pagination,
    page,
    limit,
    products.length,
  );

  return {
    products,
    // The endpoint under-reports `total` on some queries (e.g. `q=SOAH`
    // returns 4 products but `total: 1`), so never claim fewer results than
    // we are about to render.
    pagination: {
      ...pagination,
      total: Math.max(pagination.total, products.length),
    },
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

  try {
    const data = await apiGet<ApiProductDetailData>(
      `/storefront/catalog/products/${encodeURIComponent(slug)}?${qs}`,
      { skipAuth: true },
    );
    const mapped = mapProductDetail(data);
    if (mapped) return mapped;
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
  /** Collection banner. Supported by the API but unset on every collection
   *  today — the storefront falls back to its designed hero when null. */
  image?: string | null;
  imageAlt?: string | null;
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
    return await apiGet<CatalogCollection>(
      `/storefront/catalog/collections/${encodeURIComponent(slug)}?${contextQs(zoneCode)}`,
      { skipAuth: true },
    );
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
