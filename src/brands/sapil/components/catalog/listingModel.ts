import type {
  CatalogListingQuery,
  CatalogListingSort,
  StorefrontCatalogFacets,
} from "@/features/catalog/types/catalogFacets";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import { SAPIL_PASTELS, type SapilPastel } from "../../ui/shared";
import type { ToolbarFacet, ToolbarFacetOption } from "./ListingToolbar";

/** A pastel for something that has no colour of its own yet (e.g. a collection), stable per key. */
export function pastelFor(key: string): SapilPastel {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return SAPIL_PASTELS[hash % SAPIL_PASTELS.length];
}

/** A price band as `"min-max"` (either side may be empty): "-50", "50-99", "199-". */
export type PriceBand = { min?: number; max?: number };

export function bandValue(band: PriceBand): string {
  return `${band.min ?? ""}-${band.max ?? ""}`;
}

export function parseBand(value: string): PriceBand {
  const [lo, hi] = value.split("-");
  const min = lo ? Number(lo) : undefined;
  const max = hi ? Number(hi) : undefined;
  return {
    ...(min != null && Number.isFinite(min) ? { min } : {}),
    ...(max != null && Number.isFinite(max) ? { max } : {}),
  };
}

/** Shop price bands from the market's price-edit tiers: under 50, 50–99, 99–199, over 199. */
export function tierBands(tiers: number[]): PriceBand[] {
  if (!tiers.length) return [];
  const bands: PriceBand[] = [{ max: tiers[0] }];
  for (let i = 1; i < tiers.length; i += 1) bands.push({ min: tiers[i - 1], max: tiers[i] });
  bands.push({ min: tiers[tiers.length - 1] });
  return bands;
}

/** Inside a price edit: four even bands up to the ceiling (v9 priceOptions()). */
export function editBands(ceiling: number): PriceBand[] {
  const cuts = [0, ...[0.25, 0.5, 0.75].map((f) => Math.round((ceiling * f) / 5) * 5), ceiling];
  const bands: PriceBand[] = [];
  for (let i = 1; i < cuts.length; i += 1) {
    if (cuts[i] <= cuts[i - 1]) continue;
    bands.push(i === 1 ? { max: cuts[i] } : { min: cuts[i - 1], max: cuts[i] });
  }
  return bands;
}

export function bandLabel(band: PriceBand, t: SapilTranslator, money: (n: number) => string): string {
  if (band.min == null && band.max != null) return t("catalog.priceUnder", { price: money(band.max) });
  if (band.min != null && band.max == null) return t("catalog.priceOver", { price: money(band.min) });
  return t("catalog.priceBetween", { from: money(band.min ?? 0), to: money(band.max ?? 0) });
}

/** Keep bands that overlap the listing's price range (when the API reports one). */
export function bandsInRange(bands: PriceBand[], range: StorefrontCatalogFacets["price"] | null | undefined): PriceBand[] {
  if (!range) return bands;
  const lo = Number(range.min);
  const hi = Number(range.max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return bands;
  return bands.filter((b) => (b.min ?? -Infinity) <= hi && (b.max ?? Infinity) >= lo);
}

/** The selected band of a listing, as its value ("" when no price filter). */
export function selectedBand(query: CatalogListingQuery, ceiling?: number): string {
  const max = query.maxPrice && Number(query.maxPrice) !== ceiling ? query.maxPrice : "";
  if (!query.minPrice && !max) return "";
  return `${query.minPrice ?? ""}-${max}`;
}

export const LISTING_FACET_KEYS = {
  collection: "houseCollection",
  family: "fragranceFamily",
  notes: "featuredNote",
  kind: "concentration",
  price: "price",
} as const;

type FacetQueryKey = "houseCollection" | "fragranceFamily" | "featuredNote" | "concentration";

function options(list: { code: string; label: string; count: number }[] | undefined): ToolbarFacetOption[] {
  return (list ?? []).map((o) => ({ value: o.code, label: o.label, count: o.count }));
}

/**
 * The toolbar's facets from the listing API (`data.facets`) and the address.
 * One option per facet at a time (the API filters by one code each).
 * "For" (gender) appears once the API sends a gender facet.
 */
export function buildToolbarFacets({
  facets,
  query,
  bands,
  ceiling,
  t,
  money,
  include = ["collection", "family", "notes", "kind", "price"],
}: {
  facets: StorefrontCatalogFacets | null;
  query: CatalogListingQuery;
  bands: PriceBand[];
  /** price-edit ceiling (its maxPrice is not a filter) */
  ceiling?: number;
  t: SapilTranslator;
  money: (n: number) => string;
  include?: Array<keyof typeof LISTING_FACET_KEYS>;
}): ToolbarFacet[] {
  const one = (key: FacetQueryKey) => (query[key] ? [query[key] as string] : []);
  const all: Record<keyof typeof LISTING_FACET_KEYS, ToolbarFacet> = {
    collection: { key: "houseCollection", title: t("catalog.filterCollection"), options: options(facets?.houseCollection), selected: one("houseCollection") },
    family: { key: "fragranceFamily", title: t("catalog.filterFamily"), options: options(facets?.fragranceFamily), selected: one("fragranceFamily") },
    notes: { key: "featuredNote", title: t("catalog.filterNotes"), options: options(facets?.featuredNote), selected: one("featuredNote") },
    kind: { key: "concentration", title: t("catalog.filterKind"), options: options(facets?.concentration), selected: one("concentration") },
    price: {
      key: "price",
      title: t("catalog.filterPrice"),
      options: bands.map((b) => ({ value: bandValue(b), label: bandLabel(b, t, money) })),
      selected: [selectedBand(query, ceiling)].filter(Boolean),
    },
  };
  return include.map((k) => all[k]);
}

/**
 * The listing query after toggling one option: picking the selected option
 * clears the facet; another option replaces it. Price bands set min/max
 * (inside a price edit, never above its ceiling).
 */
export function toggleFacet(
  query: CatalogListingQuery,
  key: string,
  value: string,
  ceiling?: number,
): Partial<CatalogListingQuery> {
  if (key === "price") {
    const current = selectedBand(query, ceiling);
    if (current === value) return { minPrice: undefined, maxPrice: ceiling != null ? String(ceiling) : undefined };
    const band = parseBand(value);
    const max = band.max ?? ceiling;
    return {
      minPrice: band.min != null ? String(band.min) : undefined,
      maxPrice: max != null ? String(max) : undefined,
    };
  }
  const field = key as FacetQueryKey;
  return { [field]: query[field] === value ? undefined : value };
}

export function clearFacet(key: string, ceiling?: number): Partial<CatalogListingQuery> {
  if (key === "price") return { minPrice: undefined, maxPrice: ceiling != null ? String(ceiling) : undefined };
  return { [key as FacetQueryKey]: undefined };
}

export type SortChoice = "" | CatalogListingSort;

export function listingSorts(t: SapilTranslator, priceEdit = false): { value: string; label: string }[] {
  const price = [
    { value: "price_asc", label: t("catalog.sortPriceAsc") },
    { value: "price_desc", label: t("catalog.sortPriceDesc") },
  ];
  return priceEdit
    ? [...price, { value: "newest", label: t("catalog.sortNewest") }]
    : [{ value: "", label: t("catalog.sortFeatured") }, { value: "newest", label: t("catalog.sortNewest") }, ...price];
}
