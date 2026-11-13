import type { ProductSeoPackage } from "@/lib/seo/productSeo";
import type { CollectionSeoContent } from "@/features/seo-footer/collectionSeoTextView";
import { apiGet } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";
import {
  storefrontContextQuery,
  type StorefrontContextInput,
} from "@/lib/storefront/context";
import type {
  ProductCollectionRef,
  ProductDetail,
  ProductSummary,
} from "../types/product";
import {
  applyCatalogListingParams,
  catalogListingCacheKey,
  parseCatalogFacets,
  type CatalogListingFilters,
  type StorefrontCatalogFacets,
} from "../types/catalogFacets";
import { pickPdpMetafields } from "../utils/pdpMetafields";
import { pickPrVideo } from "../utils/pdpPrVideo";
import { parsePdpReviews } from "../utils/pdpReviews";
import { parseShippingPromise } from "../utils/pdpShipping";
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
  /** Present once the listing API ships `data.facets`. */
  facets: StorefrontCatalogFacets | null;
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
  category: (slug: string, zoneCode?: string | null) =>
    [...catalogKeys.all, "category", slug, zoneCode ?? "default"] as const,
  categoryProducts: (
    slug: string,
    zoneCode?: string | null,
    page = 1,
    limit = CATALOG_PAGE_SIZE,
    filters?: CatalogListingFilters,
  ) =>
    [
      ...catalogKeys.all,
      "category-products",
      slug,
      zoneCode ?? "default",
      ...(filters
        ? catalogListingCacheKey(filters)
        : ([page, limit, "all"] as const)),
    ] as const,
  listing: (
    kind: "products" | "collection" | "category",
    slug: string | null,
    zoneCode: string | null | undefined,
    filters: CatalogListingFilters,
  ) =>
    [
      ...catalogKeys.all,
      "listing",
      kind,
      slug ?? "",
      zoneCode ?? "default",
      ...catalogListingCacheKey(filters),
    ] as const,
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
    onlySellable?: boolean,
    filters?: CatalogListingFilters,
  ) =>
    [
      ...catalogKeys.all,
      "collection-products",
      slug,
      zoneCode ?? "default",
      ...(filters
        ? catalogListingCacheKey(filters)
        : ([page, limit, onlySellable ? "sellable" : "all"] as const)),
    ] as const,
};

type ApiPriceSummary = {
  price: number | string | null;
  /** Full price before a markdown, when the market has one. */
  compareAtPrice?: number | string | null;
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
  tags?: string[] | null;
  concentration?: string | null;
  houseCollection?: string | null;
  featuredNote?: string | null;
  fragranceFamilyCodes?: string[] | null;
  tileColor?: string | null;
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
    seoTitle?: string | null;
    seoDescription?: string | null;
    brandCode?: string | null;
    brandName?: string | null;
    tileColor?: string | null;
    pdpMetafields?: Record<string, unknown> | null;
    prVideo?: { url?: string | null; name?: string | null } | null;
  };
  pdpMetafields?: Record<string, unknown> | null;
  prVideo?: { url?: string | null; name?: string | null } | null;
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
  shippingPromise?: unknown;
  reviews?: unknown;
};

type ApiProductListData = {
  products: ApiCatalogProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets?: unknown;
};

function parseMoney(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

/** The struck-out full price, only when it is really above the selling price. */
function compareAtPrice(
  summary: ApiPriceSummary | null | undefined,
  price: number | null,
): number | null {
  const full = parseMoney(summary?.compareAtPrice);
  return full != null && price != null && full > price ? full : null;
}

function tileColorKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  return key ? key : null;
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
    PRODUCT_DESCRIPTION_PLACEHOLDER;

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
    tags: Array.isArray(raw.tags) ? raw.tags : undefined,
    tileColor: tileColorKey(raw.tileColor),
    compareAtPrice: compareAtPrice(raw.priceSummary, price),
    ...mapListingFacetFields(raw),
  };
}

function mapListingFacetFields(
  raw: ApiCatalogProduct,
): Pick<
  ProductSummary,
  "concentration" | "houseCollection" | "featuredNote" | "fragranceFamilyCodes"
> {
  const fields: Pick<
    ProductSummary,
    "concentration" | "houseCollection" | "featuredNote" | "fragranceFamilyCodes"
  > = {};
  if ("concentration" in raw) {
    const code = raw.concentration?.trim().toLowerCase() ?? null;
    fields.concentration = code === "edp" || code === "extrait" ? code : null;
  }
  if ("houseCollection" in raw) {
    const code = raw.houseCollection?.trim().toLowerCase() || null;
    fields.houseCollection = code;
  }
  if ("featuredNote" in raw) {
    const code = raw.featuredNote?.trim().toLowerCase() || null;
    fields.featuredNote = code;
  }
  if (Array.isArray(raw.fragranceFamilyCodes)) {
    fields.fragranceFamilyCodes = raw.fragranceFamilyCodes
      .map((code) => String(code).trim().toLowerCase())
      .filter(Boolean);
  }
  return fields;
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
    PRODUCT_DESCRIPTION_PLACEHOLDER;

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
    seoTitle: product.seoTitle?.trim() || undefined,
    seoDescription: product.seoDescription?.trim() || undefined,
    seo: (product as { seo?: ProductSeoPackage | null }).seo ?? null,
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
    tileColor: tileColorKey(product.tileColor),
    // Variants may not carry the was-price; the product-level summary does.
    compareAtPrice: compareAtPrice(
      { ...priceSummary, price: priceSummary?.price ?? null, compareAtPrice: priceSummary?.compareAtPrice ?? raw.priceSummary?.compareAtPrice },
      price,
    ),    pdpMetafields: pickPdpMetafields(raw.pdpMetafields ?? product.pdpMetafields),
    prVideo: pickPrVideo(raw),
    shippingPromise: parseShippingPromise(raw.shippingPromise),
    reviews: parsePdpReviews(raw.reviews),
  };
}

function contextQs(
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
) {
  return storefrontContextQuery({
    ...market,
    zoneCode: zoneCode?.trim() || market?.zoneCode,
  });
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

function mapProductList(
  data: ApiProductListData,
  page: number,
  limit: number,
): ProductListResult {
  const products = (data.products ?? []).map(mapProduct);
  return {
    products,
    pagination: normalizePagination(data.pagination, page, limit, products.length),
    facets: parseCatalogFacets(data.facets),
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
  /** Selected market. Channel and currency are sent as returned by the markets API. */
  context?: StorefrontContextInput | null;
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

  const qs = new URLSearchParams(contextQs(zoneCode, options.context));
  qs.set("q", q);
  qs.set("onlySellable", onlySellable ? "true" : "false");
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("sort", sort);

  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/search?${qs.toString()}`,
    { skipAuth: true },
  );
  const mapped = mapProductList(data, page, limit);
  return {
    ...mapped,
    pagination: {
      ...mapped.pagination,
      total: Math.max(mapped.pagination.total, mapped.products.length),
    },
  };
}

/**
 * Shown on the product page when a product has no description. Never use it as
 * the meta description or in structured data (search engines would index it).
 */
export const PRODUCT_DESCRIPTION_PLACEHOLDER =
  "Product details will appear once the catalog is fully refreshed.";

/** The product's own description, or undefined when it only has the placeholder. */
export function realProductDescription(
  description: string | null | undefined,
): string | undefined {
  const text = description?.trim();
  return text && text !== PRODUCT_DESCRIPTION_PLACEHOLDER ? text : undefined;
}

/**
 * Meta description for a product with no SEO description: the start of its own
 * description as plain text, at most 160 characters (what Google shows), ending
 * on a full sentence when one ends after ~104 characters, else at a word with "…".
 * Shopify uses the first 320 characters cut mid-word, which Google cuts again.
 * The admin preview uses the same rule (catalog/utils/productSeoFallback.utils.ts).
 */
export function productMetaDescription(
  description: string | null | undefined,
  maxLength = 160,
): string | undefined {
  const real = realProductDescription(description);
  if (!real) return undefined;
  const text = real
    // Some imported texts carry "\n" as two characters.
    .replace(/\\[nrt]/g, " ")
    .replace(/Â(?=[\s ])/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  if (text.length <= maxLength) return text;
  const window = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
  );
  if (sentenceEnd >= maxLength * 0.65) return window.slice(0, sentenceEnd + 1);
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export async function fetchProducts(
  zoneCode?: string | null,
  options?: CatalogListingFilters,
  market?: StorefrontContextInput | null,
): Promise<ProductListResult> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, options?.limit ?? CATALOG_PAGE_SIZE);
  const qs = new URLSearchParams(contextQs(zoneCode, market));
  applyCatalogListingParams(qs, { ...options, page, limit });
  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/products?${qs}`,
    { skipAuth: true },
  );
  return mapProductList(data, page, limit);
}

/**
 * Product by public address, telling "does not exist" apart from "could not load".
 * - `missing`: the API answered 404 and no product has this exact slug/SKU/id,
 *   so the page must respond 404 (never a 200 page or another product).
 * - Any other failure: product null, missing false (page renders; the client retries).
 */
export async function fetchProductBySlugOutcome(
  slug: string,
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<{ product: ProductDetail | null; missing: boolean }> {
  const qs = contextQs(zoneCode, market);
  let detailMissing = false;

  try {
    const data = await apiGet<ApiProductDetailData>(
      `/storefront/catalog/products/${encodeURIComponent(slug)}?${qs}`,
      { skipAuth: true },
    );
    const mapped = mapProductDetail(data);
    if (mapped) return { product: mapped, missing: false };
    detailMissing = true;
  } catch (error) {
    detailMissing = error instanceof ApiClientError && error.status === 404;
  }

  // Fallback for SKU / product-id links only. An exact match is required:
  // a fuzzy "first search result" would open a different product.
  try {
    const bySearch = await apiGet<ApiProductListData>(
      `/storefront/catalog/search?${qs}&q=${encodeURIComponent(slug)}&limit=5`,
      { skipAuth: true },
    );
    const wanted = slug.trim().toLowerCase();
    const hit = bySearch.products?.find(
      (p) =>
        p.slug?.toLowerCase() === wanted ||
        p.sku?.toLowerCase() === wanted ||
        p.productId === slug,
    );
    if (hit) return { product: mapProduct(hit), missing: false };
    return { product: null, missing: detailMissing };
  } catch {
    return { product: null, missing: false };
  }
}

export async function fetchProductBySlug(
  slug: string,
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<ProductDetail | null> {
  return (await fetchProductBySlugOutcome(slug, zoneCode, market)).product;
}

export type CatalogCollection = {
  id: string;
  code?: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  productCount?: number;
  /** Page heading when the store shows one other than the name (Shopify
   *  custom.collection_name / collection_heading); null → the name. */
  heading?: string | null;
  /** Collection banner for the page language (imported from the store's
   *  theme banners); null → the storefront's designed hero. */
  image?: string | null;
  imageAlt?: string | null;
  /** Banner version for small screens, when the store has one. */
  imageMobile?: string | null;
  /** Banner pixel sizes (when known): the page reserves the space, no layout shift. */
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageMobileWidth?: number | null;
  imageMobileHeight?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  /** SEO text block above the footer (market + language); null when none. */
  seoContent?: CollectionSeoContent | null;
  customMetafields?: Record<string, unknown> | null;
};

type ApiCollectionDetailData = CatalogCollection & {
  item?: CatalogCollection | null;
};

function mapCollectionDetail(
  raw: ApiCollectionDetailData | null | undefined,
): CatalogCollection | null {
  const item = raw?.item ?? raw;
  if (!item?.slug) return null;
  return {
    id: item.id,
    code: item.code,
    slug: item.slug,
    name: item.name,
    heading: item.heading?.trim() || null,
    description: item.description,
    sortOrder: item.sortOrder,
    productCount: item.productCount,
    image: item.image,
    imageAlt: item.imageAlt,
    imageMobile: item.imageMobile ?? null,
    imageWidth: item.imageWidth ?? null,
    imageHeight: item.imageHeight ?? null,
    imageMobileWidth: item.imageMobileWidth ?? null,
    imageMobileHeight: item.imageMobileHeight ?? null,
    seoTitle: item.seoTitle ?? raw?.seoTitle,
    seoDescription: item.seoDescription ?? raw?.seoDescription,
    seoContent: item.seoContent ?? raw?.seoContent ?? null,
    customMetafields: item.customMetafields ?? raw?.customMetafields ?? null,
  };
}

type ApiCollectionListData = {
  items: CatalogCollection[];
};

/** One public address from the backend sitemap (market-visible only). */
export type CatalogSitemapEntry = {
  entityType: "PRODUCT" | "COLLECTION" | "CATEGORY";
  path: string;
  updatedAt: string | null;
  noindex?: boolean;
};

/** Every product, collection and category visible in the market, with its market address. */
export async function fetchCatalogSitemap(
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<CatalogSitemapEntry[]> {
  const data = await apiGet<{ entries?: CatalogSitemapEntry[] }>(
    `/storefront/catalog/seo/sitemap?${contextQs(zoneCode, market)}`,
    { skipAuth: true },
  );
  return data.entries ?? [];
}

export async function fetchCollections(
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<CatalogCollection[]> {
  const data = await apiGet<ApiCollectionListData>(
    `/storefront/catalog/collections?${contextQs(zoneCode, market)}`,
    { skipAuth: true },
  );
  return data.items ?? [];
}

/** A catalog category — what navigation `CATEGORY` items (`/categories/:slug`) point at. */
export type CatalogCategory = {
  id: string;
  code?: string;
  slug: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  productCount?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  image?: string | null;
  imageAlt?: string | null;
};

/** GET /storefront/catalog/categories/:slug — `null` when it doesn't resolve. */
/** Category by slug; `missing` only when the API answered 404 (page must 404). */
export async function fetchCategoryBySlugOutcome(
  slug: string,
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<{ category: CatalogCategory | null; missing: boolean }> {
  try {
    const category = await apiGet<CatalogCategory>(
      `/storefront/catalog/categories/${encodeURIComponent(slug)}?${contextQs(zoneCode, market)}`,
      { skipAuth: true },
    );
    return { category, missing: false };
  } catch (error) {
    return {
      category: null,
      missing: error instanceof ApiClientError && error.status === 404,
    };
  }
}

export async function fetchCategoryBySlug(
  slug: string,
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<CatalogCategory | null> {
  return (await fetchCategoryBySlugOutcome(slug, zoneCode, market)).category;
}

/** GET /storefront/catalog/categories/:slug/products */
export async function fetchCategoryProducts(
  slug: string,
  zoneCode?: string | null,
  options?: CatalogListingFilters,
  market?: StorefrontContextInput | null,
): Promise<ProductListResult> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, options?.limit ?? CATALOG_PAGE_SIZE);
  const qs = new URLSearchParams(contextQs(zoneCode, market));
  applyCatalogListingParams(qs, { ...options, page, limit });
  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/categories/${encodeURIComponent(slug)}/products?${qs}`,
    { skipAuth: true },
  );
  return mapProductList(data, page, limit);
}

export async function fetchCollectionBySlug(
  slug: string,
  zoneCode?: string | null,
  market?: StorefrontContextInput | null,
): Promise<CatalogCollection | null> {
  try {
    const data = await apiGet<ApiCollectionDetailData>(
      `/storefront/catalog/collections/${encodeURIComponent(slug)}?${contextQs(zoneCode, market)}`,
      { skipAuth: true },
    );
    return mapCollectionDetail(data);
  } catch {
    return null;
  }
}

export async function fetchCollectionProducts(
  slug: string,
  zoneCode?: string | null,
  options?: CatalogListingFilters,
  market?: StorefrontContextInput | null,
): Promise<ProductListResult> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, options?.limit ?? CATALOG_PAGE_SIZE);
  const qs = new URLSearchParams(contextQs(zoneCode, market));
  applyCatalogListingParams(qs, { ...options, page, limit });
  const data = await apiGet<ApiProductListData>(
    `/storefront/catalog/collections/${encodeURIComponent(slug)}/products?${qs}`,
    { skipAuth: true },
  );
  return mapProductList(data, page, limit);
}
