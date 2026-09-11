"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { PageLoading } from "@/components/ui/PageLoading";
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
import { ProductCardTags } from "./ProductCardTags";
import { getCollectionMeta } from "../constants/collectionMeta";

function priceBounds(products: readonly CatalogProduct[]) {
  const prices = products.map((p) => p.price ?? 0);
  if (!prices.length) return { floor: 0, ceil: 0 };
  return {
    floor: Math.floor(Math.min(...prices)),
    ceil: Math.ceil(Math.max(...prices)),
  };
}

/** Banner supplied by the collections API; falls back to the static hero. */
export type CatalogBanner = {
  image?: string | null;
  imageAlt?: string | null;
  description?: string | null;
  title?: string | null;
};

export function ProductCatalogView({
  slug,
  products: productsProp,
  banner,
  loading = false,
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
}) {
  const staticMeta = useMemo(() => getCollectionMeta(slug), [slug]);
  const products = productsProp ?? CATALOG_PRODUCTS;

  // Only override the parts the API actually supplies — an empty banner keeps
  // the designed hero exactly as it is today.
  const bannerImage = banner?.image;
  const bannerDescription = banner?.description;
  const bannerTitle = banner?.title;
  const meta = useMemo(
    () => ({
      ...staticMeta,
      ...(bannerImage ? { heroImage: bannerImage } : {}),
      ...(bannerDescription ? { intro: bannerDescription } : {}),
      // Pages without a designed hero (e.g. categories) name themselves.
      ...(bannerTitle ? { title: bannerTitle, titleEm: "" } : {}),
    }),
    [staticMeta, bannerImage, bannerDescription, bannerTitle],
  );
  const heroAlt = bannerImage ? (banner?.imageAlt ?? "") : "";

  const { floor: PRICE_FLOOR, ceil: PRICE_CEIL } = useMemo(
    () => priceBounds(products),
    [products],
  );

  const [concentration, setConcentration] = useState<"all" | Concentration>("all");
  const [collection, setCollection] = useState<string>(meta.filterCollection ?? "all");
  const [note, setNote] = useState<string>("all");
  const [priceMin, setPriceMin] = useState(PRICE_FLOOR);
  const [priceMax, setPriceMax] = useState(PRICE_CEIL);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Live products arrive after mount, so the price slider's bounds change
  // under it — re-seed the range whenever the bounds move (during render,
  // not in an effect, so there's no extra cascading render).
  const [seededBounds, setSeededBounds] = useState({ floor: PRICE_FLOOR, ceil: PRICE_CEIL });
  if (seededBounds.floor !== PRICE_FLOOR || seededBounds.ceil !== PRICE_CEIL) {
    setSeededBounds({ floor: PRICE_FLOOR, ceil: PRICE_CEIL });
    setPriceMin(PRICE_FLOOR);
    setPriceMax(PRICE_CEIL);
  }

  const filtered = useMemo(() => {
    const byFacets = products.filter((p) => {
      if (concentration !== "all" && p.concentration !== concentration) return false;
      if (collection !== "all" && p.collection !== collection) return false;
      if (note !== "all" && p.note !== note) return false;
      const price = p.price ?? 0;
      if (price < priceMin || price > priceMax) return false;
      return true;
    });
    return sortCatalogProducts(byFacets, sort);
  }, [products, concentration, collection, note, priceMin, priceMax, sort]);

  const countFor = (predicate: (p: CatalogProduct) => boolean) =>
    products.filter(predicate).length;

  const notesPresent = Object.keys(NOTE_LABELS).filter((key) =>
    products.some((p) => p.note === key),
  );

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

  const fillLeft = ((priceMin - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100;
  const fillRight = 100 - ((priceMax - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100;

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
        ) : productsProp && productsProp.length === 0 ? (
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
            <div className="filters-rail__group" role="group" aria-label="Price">
              <p className="filters-rail__label">Price</p>
              <div className="price-range">
                <div className="price-range__values">
                  <span>
                    AED <strong>{priceMin.toFixed(0)}</strong>
                  </span>
                  <span>
                    AED <strong>{priceMax.toFixed(0)}</strong>
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
                    All <span className="rail-filter__count">({products.length})</span>
                  </button>
                </li>
                {(Object.keys(CONCENTRATION_LABELS) as Concentration[]).map((key) => (
                  <li key={key}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={concentration === key}
                      onClick={() => setConcentration(key)}
                    >
                      {CONCENTRATION_LABELS[key]}{" "}
                      <span className="rail-filter__count">
                        ({countFor((p) => p.concentration === key)})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

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
                  </button>
                </li>
                {Object.keys(COLLECTION_LABELS).map((key) => (
                  <li key={key}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={collection === key}
                      onClick={() => setCollection(key)}
                    >
                      {COLLECTION_LABELS[key]}{" "}
                      <span className="rail-filter__count">
                        ({countFor((p) => p.collection === key)})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

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
                  </button>
                </li>
                {notesPresent.map((key) => (
                  <li key={key}>
                    <button
                      className="rail-filter"
                      type="button"
                      aria-pressed={note === key}
                      onClick={() => setNote(key)}
                    >
                      {NOTE_LABELS[key]}{" "}
                      <span className="rail-filter__count">
                        ({countFor((p) => p.note === key)})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            </div>

            <div className="filters-rail__foot">
              <button
                type="button"
                className="filters-rail__apply"
                onClick={() => setFiltersOpen(false)}
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
                Showing {filtered.length} of {products.length}
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
                  <option value="rating">Customer Ratings</option>
                  <option value="bestselling">Best Selling</option>
                </select>
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="grid-band__empty">No products match these filters.</p>
            ) : (
              // One batched wishlist-status request for the whole grid, not one per card.
              <WishlistStatusScope>
                <ul className="product-grid" role="list">
                  {filtered.map((product) => (
                    <CatalogProductCard key={product.id} product={product} />
                  ))}
                </ul>
              </WishlistStatusScope>
            )}
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
}: {
  product: CatalogProduct;
  /** Top-right control above the card link (e.g. the wishlist heart). */
  action?: ReactNode;
  /** Unsellable products keep the card but lose the add-to-bag pill. */
  hideAdd?: boolean;
  note?: string;
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
      <ProductCardTags slug={product.slug} />
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
