export type StorefrontFacetOption = {
  code: string;
  label: string;
  count: number;
};

export type StorefrontCatalogFacets = {
  price: { min: string; max: string; currencyCode: string } | null;
  concentration: StorefrontFacetOption[];
  houseCollection: StorefrontFacetOption[];
  featuredNote: StorefrontFacetOption[];
};

export type CatalogListingSort = "newest" | "price_asc" | "price_desc" | "bestselling";

export type CatalogListingQuery = {
  page: number;
  minPrice?: string;
  maxPrice?: string;
  concentration?: string;
  houseCollection?: string;
  featuredNote?: string;
  sort?: CatalogListingSort;
};

export type CatalogListingFilters = CatalogListingQuery & {
  limit?: number;
  onlySellable?: boolean;
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseOptions(raw: unknown): StorefrontFacetOption[] {
  if (!Array.isArray(raw)) return [];
  const options: StorefrontFacetOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const code = typeof row.code === "string" ? row.code.trim() : "";
    if (!code) continue;
    const label =
      typeof row.label === "string" && row.label.trim()
        ? row.label.trim()
        : code;
    const count = Math.max(0, Number(row.count) || 0);
    options.push({ code, label, count });
  }
  return options;
}

function parsePriceRange(
  raw: unknown,
): StorefrontCatalogFacets["price"] {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const min = row.min == null ? "" : String(row.min).trim();
  const max = row.max == null ? "" : String(row.max).trim();
  if (!min || !max) return null;
  const currencyCode =
    typeof row.currencyCode === "string" && row.currencyCode.trim()
      ? row.currencyCode.trim()
      : "AED";
  return { min, max, currencyCode };
}

/** `null` when the listing payload has no `facets` object (legacy API). */
export function parseCatalogFacets(raw: unknown): StorefrontCatalogFacets | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (
    !("price" in row) &&
    !("concentration" in row) &&
    !("houseCollection" in row) &&
    !("featuredNote" in row)
  ) {
    return null;
  }
  return {
    price: parsePriceRange(row.price),
    concentration: parseOptions(row.concentration),
    houseCollection: parseOptions(row.houseCollection),
    featuredNote: parseOptions(row.featuredNote),
  };
}

const LISTING_SORTS = new Set<CatalogListingSort>([
  "newest",
  "price_asc",
  "price_desc",
]);

export function parseCatalogListingSort(
  raw: string | undefined,
): CatalogListingSort | undefined {
  if (!raw) return undefined;
  return LISTING_SORTS.has(raw as CatalogListingSort)
    ? (raw as CatalogListingSort)
    : undefined;
}

export function parseCatalogListingParams(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): CatalogListingQuery {
  const get =
    params instanceof URLSearchParams
      ? (key: string) => params.get(key) ?? ""
      : (key: string) => one(params[key]);

  const page = Math.max(1, Number.parseInt(get("page"), 10) || 1);
  const minPrice = get("minPrice").trim();
  const maxPrice = get("maxPrice").trim();
  const concentration = get("concentration").trim();
  const houseCollection = get("houseCollection").trim();
  const featuredNote = get("featuredNote").trim();
  const sort = parseCatalogListingSort(get("sort").trim());

  return {
    page,
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    ...(concentration ? { concentration } : {}),
    ...(houseCollection ? { houseCollection } : {}),
    ...(featuredNote ? { featuredNote } : {}),
    ...(sort ? { sort } : {}),
  };
}

export function catalogListingHasActiveFilters(query: CatalogListingQuery): boolean {
  return Boolean(
    query.minPrice ||
      query.maxPrice ||
      query.concentration ||
      query.houseCollection ||
      query.featuredNote,
  );
}

export function catalogListingHref(
  pathname: string,
  query: CatalogListingQuery,
  page = query.page,
): string {
  const params = new URLSearchParams();
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.concentration) params.set("concentration", query.concentration);
  if (query.houseCollection) params.set("houseCollection", query.houseCollection);
  if (query.featuredNote) params.set("featuredNote", query.featuredNote);
  if (query.sort) params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function catalogListingCacheKey(filters: CatalogListingFilters) {
  return [
    filters.page ?? 1,
    filters.limit ?? 24,
    filters.minPrice ?? "",
    filters.maxPrice ?? "",
    filters.concentration ?? "",
    filters.houseCollection ?? "",
    filters.featuredNote ?? "",
    filters.sort ?? "",
    filters.onlySellable ? "sellable" : "all",
  ] as const;
}

export function applyCatalogListingParams(
  qs: URLSearchParams,
  options: CatalogListingFilters,
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 24);
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (options.onlySellable) qs.set("onlySellable", "true");
  if (options.minPrice) qs.set("minPrice", options.minPrice);
  if (options.maxPrice) qs.set("maxPrice", options.maxPrice);
  if (options.concentration) qs.set("concentration", options.concentration);
  if (options.houseCollection) qs.set("houseCollection", options.houseCollection);
  if (options.featuredNote) qs.set("featuredNote", options.featuredNote);
  if (options.sort) qs.set("sort", options.sort);
}
