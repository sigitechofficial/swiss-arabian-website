"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { PageLoading } from "@/components/ui/PageLoading";
import { useDebounce } from "@/hooks/useDebounce";
import { useLoadedImages } from "../hooks/useLoadedImages";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import {
  CATALOG_PRODUCTS,
  COLLECTION_LABELS,
  CONCENTRATION_LABELS,
  NOTE_LABELS,
  sortCatalogProducts,
  type CatalogProduct,
  type Concentration,
  type SortOption,
} from "../constants/catalogProducts";
import { CatalogInfiniteSentinel } from "./CatalogInfiniteSentinel";
import { ProductCardTags } from "./ProductCardTags";
import { getCollectionMeta } from "../constants/collectionMeta";
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
  const urlDriven = Boolean(listingQuery);
  const staticMeta = useMemo(() => getCollectionMeta(slug), [slug]);
  const products = productsProp ?? CATALOG_PRODUCTS;

  const bannerImage = banner?.image;
  const bannerDescription = banner?.description;
  const bannerTitle = banner?.title;
  const meta = useMemo(
    () => ({
      ...staticMeta,
      ...(bannerImage ? { heroImage: bannerImage } : {}),
      ...(bannerDescription ? { intro: bannerDescription } : {}),
      ...(bannerTitle ? { title: bannerTitle, titleEm: "" } : {}),
    }),
    [staticMeta, bannerImage, bannerDescription, bannerTitle],
  );
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
    html.classList.add("is-filters-open");
    body.classList.add("is-filters-open");
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.classList.remove("is-filters-open");
      body.classList.remove("is-filters-open");
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [filtersOpen]);

  const span = PRICE_CEIL - PRICE_FLOOR || 1;
  const fillLeft = ((priceMin - PRICE_FLOOR) / span) * 100;
  const fillRight = 100 - ((priceMax - PRICE_FLOOR) / span) * 100;

  return (
    <div className="landing">
      <section className="collection-head" aria-labelledby="collection-heading">
        <div className="container container--full">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol className="crumbs__list" role="list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">
                {meta.title} {meta.titleEm}
              </li>
            </ol>
          </nav>

          <div className="collection-hero">
            <img
              className="collection-hero__media"
              src={meta.heroImage}
              alt={heroAlt}
              width={720}
              height={1040}
              fetchPriority="high"
            />
            <div className="collection-hero__panel">
              <p className="collection-head__eyebrow">{meta.eyebrow}</p>
              <h1 className="collection-head__title" id="collection-heading">
                {meta.title} <em className="collection-head__em">{meta.titleEm}</em>
              </h1>
              <p className="collection-head__intro">{meta.intro}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-band products-band" aria-labelledby="grid-heading">
        <h2 className="visually-hidden" id="grid-heading">
          Products
        </h2>

        {loading ? (
          <div className="container container--full">
            <PageLoading label="Loading fragrances…" />
          </div>
        ) : emptyCollection ? (
          <div className="container container--full">
            <div className="catalog-empty" role="status">
              <img
                className="catalog-empty__art"
                src="/assets/catalog/empty-products.svg"
                alt=""
                width={180}
                height={180}
              />
              <p className="catalog-empty__eyebrow">Coming soon</p>
              <h3 className="catalog-empty__title">No fragrances here yet</h3>
              <p className="catalog-empty__text">
                We’re still filling this collection. Explore the rest of the house in the meantime.
              </p>
              <Link className="catalog-empty__cta" href="/products">
                Browse all fragrances
              </Link>
            </div>
          </div>
        ) : (
        <div className="catalog container container--full">
          <button
            type="button"
            className={`filters-backdrop ${filtersOpen ? "is-open" : ""}`}
            aria-label="Close filters"
            tabIndex={filtersOpen ? 0 : -1}
            onClick={() => setFiltersOpen(false)}
          />
          <aside
            className={`filters-rail ${filtersOpen ? "filters-rail--open" : ""}`}
            aria-label="Filters"
          >
            <div className="filters-rail__head">
              <p className="filters-rail__title">Filter by</p>
              <button
                type="button"
                className="filters-rail__close"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            <div className="filters-rail__body">
            {showPrice ? (
            <div className="filters-rail__group" role="group" aria-label="Price">
              <p className="filters-rail__label">Price</p>
              <div className="price-range">
                <div className="price-range__values">
                  <span>
                    {currency} <strong>{priceMin.toFixed(0)}</strong>
                  </span>
                  <span>
                    {currency} <strong>{priceMax.toFixed(0)}</strong>
                  </span>
                </div>
                <div className="price-range__slider">
                  <div className="price-range__track" />
                  <div
                    className="price-range__fill"
                    style={{ insetInlineStart: `${fillLeft}%`, insetInlineEnd: `${fillRight}%` }}
                  />
                  <input
                    type="range"
                    min={PRICE_FLOOR}
                    max={PRICE_CEIL}
                    value={priceMin}
                    step={1}
                    aria-label="Minimum price"
                    onChange={(event) => {
                      const next = Math.min(Number(event.target.value), priceMax);
                      setPriceMin(next);
                    }}
                  />
                  <input
                    type="range"
                    min={PRICE_FLOOR}
                    max={PRICE_CEIL}
                    value={priceMax}
                    step={1}
                    aria-label="Maximum price"
                    onChange={(event) => {
                      const next = Math.max(Number(event.target.value), priceMin);
                      setPriceMax(next);
                    }}
                  />
                </div>
              </div>
            </div>
            ) : null}

            {showConcentration ? (
            <div className="filters-rail__group" role="group" aria-label="Concentration">
              <p className="filters-rail__label">Concentration</p>
              <ul className="filters-rail__list" role="list">
                <li>
                  <button
                    className="rail-filter"
                    type="button"
                    aria-pressed={concentration === "all"}
                    onClick={() => setConcentration("all")}
                  >
                    All <span className="rail-filter__count">({allCount})</span>
                  </button>
                </li>
                {concentrationOptions.map((option) => (
                  <li key={option.code}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={concentration === option.code}
                      onClick={() => setConcentration(option.code)}
                    >
                      {option.label}{" "}
                      <span className="rail-filter__count">({option.count})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}

            {showCollection ? (
            <div className="filters-rail__group" role="group" aria-label="Collection">
              <p className="filters-rail__label">Collection</p>
              <ul className="filters-rail__list" role="list">
                <li>
                  <button
                    className="rail-filter"
                    type="button"
                    aria-pressed={collection === "all"}
                    onClick={() => setCollection("all")}
                  >
                    All collections
                    {serverFiltered ? (
                      <span className="rail-filter__count"> ({allCount})</span>
                    ) : null}
                  </button>
                </li>
                {collectionOptions.map((option) => (
                  <li key={option.code}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={collection === option.code}
                      onClick={() => setCollection(option.code)}
                    >
                      {option.label}{" "}
                      <span className="rail-filter__count">({option.count})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}

            {showNotes ? (
            <div className="filters-rail__group" role="group" aria-label="Featured note">
              <p className="filters-rail__label">Featured note</p>
              <ul className="filters-rail__list" role="list">
                <li>
                  <button
                    className="rail-filter"
                    type="button"
                    aria-pressed={note === "all"}
                    onClick={() => setNote("all")}
                  >
                    All notes
                    {serverFiltered ? (
                      <span className="rail-filter__count"> ({allCount})</span>
                    ) : null}
                  </button>
                </li>
                {noteOptions.map((option) => (
                  <li key={option.code}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={note === option.code}
                      onClick={() => setNote(option.code)}
                    >
                      {option.label}{" "}
                      <span className="rail-filter__count">({option.count})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}

            {showFragranceFamily ? (
            <div className="filters-rail__group" role="group" aria-label="Fragrance family">
              <p className="filters-rail__label">Fragrance family</p>
              <ul className="filters-rail__list" role="list">
                <li>
                  <button
                    className="rail-filter"
                    type="button"
                    aria-pressed={fragranceFamily === "all"}
                    onClick={() => setFragranceFamily("all")}
                  >
                    All families
                    {serverFiltered ? (
                      <span className="rail-filter__count"> ({allCount})</span>
                    ) : null}
                  </button>
                </li>
                {fragranceFamilyOptions.map((option) => (
                  <li key={option.code}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={fragranceFamily === option.code}
                      onClick={() => setFragranceFamily(option.code)}
                    >
                      {option.label}{" "}
                      <span className="rail-filter__count">({option.count})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}
            </div>

            <div className="filters-rail__foot">
              <button
                type="button"
                className="filters-rail__apply"
                onClick={() => {
                  if (urlDriven && listingQuery) {
                    const atBounds =
                      priceMin === PRICE_FLOOR && priceMax === PRICE_CEIL;
                    pushListing({
                      ...listingQuery,
                      minPrice: atBounds ? undefined : String(priceMin),
                      maxPrice: atBounds ? undefined : String(priceMax),
                      page: 1,
                    });
                  }
                  setFiltersOpen(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </aside>

          <div className="catalog__main">
            <div className="catalog__toolbar">
              <button
                type="button"
                className="app-filters-btn"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                Filters
              </button>
              <p className="catalog__count" aria-live="polite">
                Showing {filtered.length} of {allCount}
              </p>
              <label className="catalog__sort">
                <span className="catalog__sort-label">Sort by</span>
                <select
                  className="catalog__sort-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  {serverFiltered ? null : (
                    <>
                      <option value="rating">Customer Ratings</option>
                      <option value="bestselling">Best Selling</option>
                    </>
                  )}
                </select>
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="grid-band__empty">No products match these filters.</p>
            ) : (
              <WishlistStatusScope>
                <ul className="product-grid" role="list">
                  {filtered.map((product) => (
                    <CatalogProductCard
                      key={product.id}
                      product={product}
                      collectionSlug={slug}
                    />
                  ))}
                </ul>
              </WishlistStatusScope>
            )}
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

export function CatalogProductCard({
  product,
  action,
  hideAdd = false,
  note,
  collectionSlug,
}: {
  product: CatalogProduct;
  /** Top-right control above the card link (e.g. the wishlist heart). */
  action?: ReactNode;
  /** Unsellable products keep the card but lose the add-to-bag pill. */
  hideAdd?: boolean;
  note?: string;
  collectionSlug?: string;
}) {
  // Live catalog media 404s for some products, which would otherwise render a
  // broken-image icon and its alt text. Fall back to the same bottle
  // placeholder the card already uses when a product has no image at all.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imageFailed;

  // Only swap to the hover image once it has really loaded — a broken hover
  // URL would otherwise fade the bottle out onto a blank card.
  const hoverCandidate = product.imageUrls?.[1];
  const hover = hoverCandidate && hoverCandidate !== product.imageUrl ? hoverCandidate : null;
  const loadedImages = useLoadedImages([hover]);
  const hasIngredientsHover = !imageFailed && Boolean(hover && loadedImages.has(hover));

  return (
    <li
      className="product-card"
      style={
        hasIngredientsHover
          ? ({ "--ingredients-bg": `url(${hover})` } as CSSProperties)
          : undefined
      }
    >
      <Link className="product-card__link" href={`/products/${product.slug}`} aria-label={product.title} />
      <ProductCardTags
        slug={product.slug}
        tags={product.tags ?? []}
        collectionSlug={collectionSlug}
      />
      <div
        className={
          hasIngredientsHover ? "product-card__media product-card__media--swap" : "product-card__media"
        }
      >
        <Link
          className="product-card__media-link"
          href={`/products/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          {showImage ? (
            <img
              src={product.imageUrl as string}
              alt={product.title}
              width={600}
              height={600}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="bottle" aria-hidden="true" />
          )}
        </Link>
      </div>
      <div className="product-card__action">
        {/* Wishlist heart by default; renders nothing for non-live (static) ids. */}
        {action ?? <WishlistHeartButton productId={product.id} />}
      </div>
      {hideAdd ? null : (
        <div className="product-card__add-slot">
          <AddToBagButton product={product} variant="product" />
        </div>
      )}
      <div className="product-card__body">
        <p className="product-card__eyebrow">{cardEyebrow(product.subtitle)}</p>
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatMoney(product.price, product.currency)}</p>
        {note ? <p className="product-card__note">{note}</p> : null}
      </div>
    </li>
  );
}
