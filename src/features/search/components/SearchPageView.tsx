"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CatalogProductCard } from "@/features/catalog/components/ProductCatalogView";
import { CatalogInfiniteSentinel } from "@/features/catalog/components/CatalogInfiniteSentinel";
import { toCatalogProducts } from "@/features/catalog/utils/toCatalogProduct";
import type { CatalogSearchSort } from "@/features/catalog/api/catalog.service";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import {
  SEARCH_IDLE_SHORTCUTS,
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_SORT_OPTIONS,
} from "../constants";
import { useCatalogSearch } from "../hooks/useCatalogSearch";
import { useNewLaunchesPreview } from "../hooks/useNewLaunchesPreview";
import { rememberSearchQuery } from "../utils/recentSearches";

function searchHref(input: {
  q: string;
  sort?: CatalogSearchSort;
}): string {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.sort && input.sort !== "newest") params.set("sort", input.sort);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function SearchPageView({
  query,
  sort = "newest",
}: {
  query: string;
  sort?: CatalogSearchSort;
}) {
  const router = useRouter();
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const tooShortQuery = hasQuery && trimmed.length < SEARCH_MIN_QUERY_LENGTH;
  const {
    products,
    total,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useCatalogSearch(trimmed, { sort, immediate: true, infinite: true });

  const showDiscover = !hasQuery || tooShortQuery || (!isLoading && !isError && !products.length);
  const newest = useNewLaunchesPreview(showDiscover, 4);
  const cards = toCatalogProducts(products, { guessFacets: false });

  useEffect(() => {
    if (trimmed.length >= SEARCH_MIN_QUERY_LENGTH) rememberSearchQuery(trimmed);
  }, [trimmed]);

  const countLabel =
    total === 1 ? "1 product" : `${total.toLocaleString()} products`;

  return (
    <div className="landing search-plp">
      <div className="container container--full">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol className="crumbs__list" role="list">
            <li>
              <Link href="/">Home</Link>
            </li>
            {hasQuery ? (
              <>
                <li>
                  <Link href="/search">Search</Link>
                </li>
                <li aria-current="page">“{trimmed}”</li>
              </>
            ) : (
              <li aria-current="page">Search</li>
            )}
          </ol>
        </nav>

        <header className="search-plp__head">
          <div>
            <p className="search-plp__eyebrow">Search</p>
            <h1 className="search-plp__title" id="search-heading">
              {hasQuery ? (
                <>
                  Results for <em className="search-plp__query">“{trimmed}”</em>
                </>
              ) : (
                "Find a fragrance"
              )}
            </h1>
            <p className="search-plp__meta" aria-live="polite">
              {tooShortQuery
                ? `Type at least ${SEARCH_MIN_QUERY_LENGTH} characters.`
                : isError
                  ? "We couldn’t reach the catalog."
                  : hasQuery && !isLoading
                    ? products.length
                      ? countLabel
                      : "No products matched."
                    : hasQuery && isLoading
                      ? "Searching…"
                      : "Search by name, note, or SKU."}
            </p>
          </div>
          {hasQuery ? (
            <Link className="search-plp__clear" href="/search">
              Clear
            </Link>
          ) : null}
        </header>

        {hasQuery && !tooShortQuery && (products.length || isFetching) ? (
          <div className="catalog__toolbar search-plp__toolbar">
            <p className="catalog__count" aria-live="polite">
              {isLoading
                ? "Searching the catalog…"
                : `Showing ${products.length} of ${total.toLocaleString()}`}
            </p>
            <label className="catalog__sort">
              <span className="catalog__sort-label">Sort</span>
              <select
                className="catalog__sort-select"
                value={sort}
                onChange={(event) => {
                  router.push(
                    searchHref({
                      q: trimmed,
                      sort: event.target.value as CatalogSearchSort,
                    }),
                  );
                }}
              >
                {SEARCH_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {isError ? (
          <div className="catalog-empty">
            <p className="catalog-empty__eyebrow">Unavailable</p>
            <h2 className="catalog-empty__title">Search didn’t load.</h2>
            <p className="catalog-empty__text">Check your connection, then try again.</p>
            <button type="button" className="catalog-empty__cta" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : isLoading && hasQuery && !tooShortQuery ? (
          <p className="search-plp__status" role="status">
            Searching the catalog…
          </p>
        ) : cards.length ? (
          <section className="products-band" aria-labelledby="search-heading">
            <WishlistStatusScope>
              <ul className="product-grid" role="list">
                {cards.map((product) => (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    hideAdd={product.isSellable === false}
                  />
                ))}
              </ul>
            </WishlistStatusScope>
            <CatalogInfiniteSentinel
              disabled={!hasNextPage}
              loading={isFetchingNextPage}
              onVisible={fetchNextPage}
            />
          </section>
        ) : (
          <SearchDiscover
            query={tooShortQuery || !hasQuery ? "" : trimmed}
            newest={newest}
          />
        )}
      </div>
    </div>
  );
}

function SearchDiscover({
  query,
  newest,
}: {
  query: string;
  newest: ReturnType<typeof useNewLaunchesPreview>;
}) {
  return (
    <div className="search-plp__discover">
      <div className="catalog-empty search-plp__empty">
        <p className="catalog-empty__eyebrow">{query ? "No matches" : "Start here"}</p>
        <h2 className="catalog-empty__title">
          {query ? `Nothing matched “${query}”.` : "Search the collection."}
        </h2>
        <p className="catalog-empty__text">
          {query
            ? "Try a shorter spelling, a note, or a SKU. Or browse what’s new."
            : "Type a name, note, or SKU in the header, or jump to a destination below."}
        </p>
        <ul className="search-plp__chips" role="list">
          {SEARCH_IDLE_SHORTCUTS.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <Link className="catalog-empty__cta" href="/products">
          Browse all fragrances
        </Link>
      </div>

      {newest.length ? (
        <section className="products-band search-plp__new" aria-labelledby="search-new-in">
          <div className="search-plp__new-head">
            <h2 className="search-plp__new-title" id="search-new-in">
              New in
            </h2>
            <Link href="/collections/new-launches">See all</Link>
          </div>
          <WishlistStatusScope>
            <ul className="product-grid" role="list">
              {toCatalogProducts(newest, { guessFacets: false }).map((product) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  hideAdd={product.isSellable === false}
                />
              ))}
            </ul>
          </WishlistStatusScope>
        </section>
      ) : null}
    </div>
  );
}
