"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
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
import { getCollectionMeta } from "../constants/collectionMeta";

const ALL_PRICES = CATALOG_PRODUCTS.map((p) => p.price ?? 0);
const PRICE_FLOOR = Math.floor(Math.min(...ALL_PRICES));
const PRICE_CEIL = Math.ceil(Math.max(...ALL_PRICES));

export function ProductCatalogView({ slug }: { slug?: string }) {
  const meta = useMemo(() => getCollectionMeta(slug), [slug]);

  const [concentration, setConcentration] = useState<"all" | Concentration>("all");
  const [collection, setCollection] = useState<string>(meta.filterCollection ?? "all");
  const [note, setNote] = useState<string>("all");
  const [priceMin, setPriceMin] = useState(PRICE_FLOOR);
  const [priceMax, setPriceMax] = useState(PRICE_CEIL);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const byFacets = CATALOG_PRODUCTS.filter((p) => {
      if (concentration !== "all" && p.concentration !== concentration) return false;
      if (collection !== "all" && p.collection !== collection) return false;
      if (note !== "all" && p.note !== note) return false;
      const price = p.price ?? 0;
      if (price < priceMin || price > priceMax) return false;
      return true;
    });
    return sortCatalogProducts(byFacets, sort);
  }, [concentration, collection, note, priceMin, priceMax, sort]);

  const countFor = (predicate: (p: CatalogProduct) => boolean) =>
    CATALOG_PRODUCTS.filter(predicate).length;

  const notesPresent = Object.keys(NOTE_LABELS).filter((key) =>
    CATALOG_PRODUCTS.some((p) => p.note === key),
  );

  // Preload + decode every ingredients hover image up front so the first
  // hover crossfade doesn't blink (same fix as the landing product strip).
  useEffect(() => {
    CATALOG_PRODUCTS.forEach((product) => {
      const hover = product.imageUrls?.[1];
      if (hover && hover !== product.imageUrl) {
        const img = new Image();
        img.src = hover;
        img.decode?.().catch(() => {});
      }
    });
  }, []);

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
              alt=""
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

        <div className="catalog container container--full">
          <aside className={`filters-rail ${filtersOpen ? "filters-rail--open" : ""}`} aria-label="Filters">
            <p className="filters-rail__title">Filter by</p>

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
                    All <span className="rail-filter__count">({CATALOG_PRODUCTS.length})</span>
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
                Showing {filtered.length} of {CATALOG_PRODUCTS.length}
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
              <ul className="product-grid" role="list">
                {filtered.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const hover = product.imageUrls?.[1] ?? product.imageUrl;
  const hasIngredientsHover = Boolean(hover && hover !== product.imageUrl);

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
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} width={600} height={600} loading="lazy" />
          ) : (
            <span className="bottle" aria-hidden="true" />
          )}
        </Link>
      </div>
      <div className="product-card__add-slot">
        <AddToBagButton product={product} variant="product" />
      </div>
      <div className="product-card__body">
        <p className="product-card__eyebrow">{cardEyebrow(product.subtitle)}</p>
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatMoney(product.price, product.currency)}</p>
      </div>
    </li>
  );
}
