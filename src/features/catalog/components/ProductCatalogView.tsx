"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/PageLoading";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useDebounce } from "@/hooks/useDebounce";
import { usePromotionDiscovery } from "@/features/promotions/hooks/usePromotionDiscovery";
import { pageContainer, visuallyHidden } from "@/styles/siteChrome";
import { gridBand } from "@/styles/shopChrome";
import { catalogLayout, catalogMain } from "../catalogChrome";
import {
  COLLECTION_LABELS,
  CONCENTRATION_LABELS,
  NOTE_LABELS,
  sortCatalogProducts,
  type CatalogProduct,
  type Concentration,
  type SortOption,
} from "../constants/catalogProducts";
import { CatalogInfiniteSentinel } from "./CatalogInfiniteSentinel";
import { CatalogCollectionEmpty } from "./catalog/CatalogCollectionEmpty";
import { CatalogFilters } from "./catalog/CatalogFilters";
import { CatalogGrid } from "./catalog/CatalogGrid";
import { CatalogHero } from "./catalog/CatalogHero";
import { CatalogToolbar } from "./catalog/CatalogToolbar";
import {
  catalogListingHasActiveFilters,
  catalogListingHref,
  type CatalogListingQuery,
  type CatalogListingSort,
  type StorefrontCatalogFacets,
  type StorefrontFacetOption,
} from "../types/catalogFacets";
import type { CatalogPagination as CatalogPaginationMeta } from "../api/catalog.service";

function priceBounds(products: readonly CatalogProduct[]) {
  const prices = products.map((p) => p.price ?? 0);
  if (!prices.length) return { floor: 0, ceil: 0 };
  return {
    floor: Math.floor(Math.min(...prices)),
    ceil: Math.ceil(Math.max(...prices)),
  };
}

function listingSortToUi(sort?: CatalogListingSort): SortOption {
  if (sort === "newest") return "newest";
  if (sort === "price_asc") return "price-asc";
  if (sort === "price_desc") return "price-desc";
  return "featured";
}

function uiSortToListing(sort: SortOption): CatalogListingSort | undefined {
  if (sort === "newest") return "newest";
  if (sort === "price-asc") return "price_asc";
  if (sort === "price-desc") return "price_desc";
  return undefined;
}

/** Banner supplied by the collections API; falls back to the static hero. */
export type CatalogBanner = {
  image?: string | null;
  mobileImage?: string | null;
  imageAlt?: string | null;
  description?: string | null;
  title?: string | null;
};

export function ProductCatalogView({
  slug,
  products: productsProp,
  banner,
  loading = false,
  listingQuery,
  facets = null,
  pagination = null,
  serverFiltered = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: {
  slug?: string;
  /**
   * Live catalog products. Omitted → the static catalog (unchanged). An empty
   * array is a real "this collection has no products" and shows the empty state.
   */
  products?: CatalogProduct[];
  banner?: CatalogBanner | null;
  /** Live products are still loading — keep the hero, hold the grid. */
  loading?: boolean;
  listingQuery?: CatalogListingQuery;
  facets?: StorefrontCatalogFacets | null;
  pagination?: CatalogPaginationMeta | null;
  serverFiltered?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const copy = useShopCopy();
  const urlDriven = Boolean(listingQuery);
  const products = productsProp ?? [];

  const bannerImage = banner?.image;
  const bannerDescription = banner?.description;
  const bannerTitle = banner?.title;
  const meta = useMemo(() => {
    const name = bannerTitle?.trim() || "";
    const description = bannerDescription?.trim() || "";
    if (slug || name) {
      return {
        eyebrow: "",
        title: name,
        titleEm: "",
        intro: description,
        heroImage: bannerImage ?? "",
        filterCollection: undefined,
      };
    }
    return {
      eyebrow: "",
      title: copy("allProducts"),
      titleEm: "",
      intro: "",
      heroImage: "",
      filterCollection: undefined,
    };
  }, [bannerImage, bannerDescription, bannerTitle, copy, slug]);
  const heroAlt = bannerImage ? (banner?.imageAlt ?? "") : "";

  const facetPrice = facets?.price;
  const { floor: PRICE_FLOOR, ceil: PRICE_CEIL } = useMemo(() => {
    if (facetPrice) {
      const floor = Math.floor(Number(facetPrice.min));
      const ceil = Math.ceil(Number(facetPrice.max));
      if (Number.isFinite(floor) && Number.isFinite(ceil) && ceil >= floor) {
        return { floor, ceil };
      }
    }
    return priceBounds(products);
  }, [facetPrice, products]);

  const currency =
    facetPrice?.currencyCode || products.find((p) => p.currency)?.currency || "AED";

  const [localConcentration, setLocalConcentration] = useState<"all" | Concentration>("all");
  const [localCollection, setLocalCollection] = useState<string>(
    meta.filterCollection ?? "all",
  );
  const [localNote, setLocalNote] = useState<string>("all");
  const [localSort, setLocalSort] = useState<SortOption>("featured");
  const [priceMin, setPriceMin] = useState(PRICE_FLOOR);
  const [priceMax, setPriceMax] = useState(PRICE_CEIL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const skipPriceSync = useRef(true);

  const concentration = urlDriven
    ? (listingQuery?.concentration as Concentration | undefined) ?? "all"
    : localConcentration;
  const collection = urlDriven
    ? listingQuery?.houseCollection ?? "all"
    : localCollection;
  const note = urlDriven ? listingQuery?.featuredNote ?? "all" : localNote;
  const fragranceFamily = urlDriven
    ? listingQuery?.fragranceFamily ?? "all"
    : "all";
  const sort: SortOption = urlDriven
    ? listingSortToUi(listingQuery?.sort)
    : localSort;

  const [seededBounds, setSeededBounds] = useState({
    floor: PRICE_FLOOR,
    ceil: PRICE_CEIL,
  });
  if (seededBounds.floor !== PRICE_FLOOR || seededBounds.ceil !== PRICE_CEIL) {
    skipPriceSync.current = true;
    setSeededBounds({ floor: PRICE_FLOOR, ceil: PRICE_CEIL });
    const urlMin = listingQuery?.minPrice ? Number(listingQuery.minPrice) : PRICE_FLOOR;
    const urlMax = listingQuery?.maxPrice ? Number(listingQuery.maxPrice) : PRICE_CEIL;
    setPriceMin(
      Number.isFinite(urlMin) ? Math.min(Math.max(urlMin, PRICE_FLOOR), PRICE_CEIL) : PRICE_FLOOR,
    );
    setPriceMax(
      Number.isFinite(urlMax) ? Math.max(Math.min(urlMax, PRICE_CEIL), PRICE_FLOOR) : PRICE_CEIL,
    );
  }

  const pushListing = (next: CatalogListingQuery) => {
    router.push(catalogListingHref(pathname, next), { scroll: false });
  };

  const patchListing = (patch: Partial<CatalogListingQuery>) => {
    if (!listingQuery) return;
    pushListing({
      ...listingQuery,
      ...patch,
      page: 1,
    });
  };

  const setConcentration = (value: "all" | Concentration | string) => {
    if (urlDriven) {
      patchListing({
        concentration: value === "all" ? undefined : String(value),
      });
      return;
    }
    setLocalConcentration(value === "all" ? "all" : (value as Concentration));
  };

  const setCollection = (value: string) => {
    if (urlDriven) {
      patchListing({
        houseCollection: value === "all" ? undefined : value,
      });
      return;
    }
    setLocalCollection(value);
  };

  const setNote = (value: string) => {
    if (urlDriven) {
      patchListing({ featuredNote: value === "all" ? undefined : value });
      return;
    }
    setLocalNote(value);
  };

  const setFragranceFamily = (value: string) => {
    if (urlDriven) {
      patchListing({ fragranceFamily: value === "all" ? undefined : value });
    }
  };

  const setSort = (value: SortOption) => {
    if (urlDriven) {
      const apiSort = uiSortToListing(value);
      patchListing({ sort: apiSort });
      return;
    }
    setLocalSort(value);
  };

  const debouncedMin = useDebounce(priceMin, 400);
  const debouncedMax = useDebounce(priceMax, 400);
  useEffect(() => {
    if (!urlDriven || !listingQuery) return;
    if (skipPriceSync.current) {
      skipPriceSync.current = false;
      return;
    }
    const atBounds = debouncedMin === PRICE_FLOOR && debouncedMax === PRICE_CEIL;
    const minPrice = atBounds ? undefined : String(debouncedMin);
    const maxPrice = atBounds ? undefined : String(debouncedMax);
    if (minPrice === listingQuery.minPrice && maxPrice === listingQuery.maxPrice) {
      return;
    }
    pushListing({ ...listingQuery, minPrice, maxPrice, page: 1 });
  }, [debouncedMin, debouncedMax, PRICE_FLOOR, PRICE_CEIL]);

  const filtered = useMemo(() => {
    if (serverFiltered) return products;
    const byFacets = products.filter((p) => {
      if (concentration !== "all" && p.concentration !== concentration) return false;
      if (collection !== "all" && p.collection !== collection) return false;
      if (note !== "all" && p.note !== note) return false;
      const price = p.price ?? 0;
      if (price < priceMin || price > priceMax) return false;
      return true;
    });
    return sortCatalogProducts(byFacets, sort);
  }, [
    serverFiltered,
    products,
    concentration,
    collection,
    note,
    priceMin,
    priceMax,
    sort,
  ]);
  const discovery = usePromotionDiscovery(filtered.map((product) => product.id));
  const campaignTiles = discovery.data?.tiles ?? [];

  const allCount = serverFiltered
    ? (pagination?.total ?? products.length)
    : products.length;

  const countFor = (predicate: (p: CatalogProduct) => boolean) =>
    products.filter(predicate).length;

  const concentrationOptions: StorefrontFacetOption[] = serverFiltered
    ? (facets?.concentration ?? [])
    : (Object.keys(CONCENTRATION_LABELS) as Concentration[]).map((code) => ({
        code,
        label: CONCENTRATION_LABELS[code],
        count: countFor((p) => p.concentration === code),
      }));

  const collectionOptions: StorefrontFacetOption[] = serverFiltered
    ? (facets?.houseCollection ?? [])
    : Object.keys(COLLECTION_LABELS).map((code) => ({
        code,
        label: COLLECTION_LABELS[code] ?? code,
        count: countFor((p) => p.collection === code),
      }));

  const noteOptions: StorefrontFacetOption[] = serverFiltered
    ? (facets?.featuredNote ?? [])
    : Object.keys(NOTE_LABELS)
        .filter((key) => products.some((p) => p.note === key))
        .map((code) => ({
          code,
          label: NOTE_LABELS[code] ?? code,
          count: countFor((p) => p.note === code),
        }));

  const fragranceFamilyOptions: StorefrontFacetOption[] = serverFiltered
    ? (facets?.fragranceFamily ?? [])
    : [];

  const showPrice = !serverFiltered || Boolean(facetPrice);
  const showConcentration = concentrationOptions.length > 0;
  const showCollection = collectionOptions.length > 0;
  const showNotes = noteOptions.length > 0;
  const showFragranceFamily =
    fragranceFamilyOptions.length > 0 || fragranceFamily !== "all";

  const hasActiveFilters = listingQuery
    ? catalogListingHasActiveFilters(listingQuery) ||
      priceMin > PRICE_FLOOR ||
      priceMax < PRICE_CEIL
    : concentration !== "all" ||
      collection !== "all" ||
      note !== "all" ||
      priceMin > PRICE_FLOOR ||
      priceMax < PRICE_CEIL;

  const emptyCollection =
    Boolean(productsProp) &&
    productsProp!.length === 0 &&
    !hasActiveFilters;

  useEffect(() => {
    if (!filtersOpen) return;
    const html = document.documentElement;
    const { body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [filtersOpen]);

  const span = PRICE_CEIL - PRICE_FLOOR || 1;
  const fillLeft = ((priceMin - PRICE_FLOOR) / span) * 100;
  const fillRight = 100 - ((priceMax - PRICE_FLOOR) / span) * 100;

  const applyFilters = () => {
    if (urlDriven && listingQuery) {
      const atBounds = priceMin === PRICE_FLOOR && priceMax === PRICE_CEIL;
      pushListing({
        ...listingQuery,
        minPrice: atBounds ? undefined : String(priceMin),
        maxPrice: atBounds ? undefined : String(priceMax),
        page: 1,
      });
    }
    setFiltersOpen(false);
  };

  return (
    <div>
      <CatalogHero meta={meta} heroAlt={heroAlt} />

      <section className={gridBand} aria-labelledby="grid-heading">
        <h2 className={visuallyHidden} id="grid-heading">
          Products
        </h2>

        {loading ? (
          <div className={pageContainer}>
            <PageLoading label={copy("loading")} />
          </div>
        ) : emptyCollection ? (
          <CatalogCollectionEmpty />
        ) : (
          <div className={`${catalogLayout} ${pageContainer}`}>
            <CatalogFilters
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              currency={currency}
              priceFloor={PRICE_FLOOR}
              priceCeil={PRICE_CEIL}
              priceMin={priceMin}
              priceMax={priceMax}
              fillLeft={fillLeft}
              fillRight={fillRight}
              onPriceMin={setPriceMin}
              onPriceMax={setPriceMax}
              showPrice={showPrice}
              allCount={allCount}
              serverFiltered={serverFiltered}
              showConcentration={showConcentration}
              concentration={concentration}
              concentrationOptions={concentrationOptions}
              onConcentration={setConcentration}
              showCollection={showCollection}
              collection={collection}
              collectionOptions={collectionOptions}
              onCollection={setCollection}
              showNotes={showNotes}
              note={note}
              noteOptions={noteOptions}
              onNote={setNote}
              showFragranceFamily={showFragranceFamily}
              fragranceFamily={fragranceFamily}
              fragranceFamilyOptions={fragranceFamilyOptions}
              onFragranceFamily={setFragranceFamily}
              onApply={applyFilters}
            />
            <div className={catalogMain}>
              <CatalogToolbar
                filtersOpen={filtersOpen}
                onToggleFilters={() => setFiltersOpen((open) => !open)}
                shown={filtered.length}
                total={allCount}
                sort={sort}
                onSort={setSort}
                serverFiltered={serverFiltered}
              />
              <CatalogGrid
                products={filtered}
                collectionSlug={slug}
                campaignTiles={campaignTiles}
                discovery={discovery.data}
              />
              {serverFiltered && onLoadMore ? (
                <CatalogInfiniteSentinel
                  disabled={!hasNextPage}
                  loading={isFetchingNextPage}
                  onVisible={onLoadMore}
                />
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
