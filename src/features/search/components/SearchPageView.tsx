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
import {
  catalogCount,
  catalogSort,
  catalogSortLabel,
  catalogSortSelect,
  catalogSortSelectStyle,
  emptyCta,
  emptyEyebrow,
  emptyText,
  emptyTitle,
  toolbar,
} from "@/features/catalog/catalogChrome";

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
    <div className="landing bg-[var(--cream,#faf6ee)] pb-[clamp(3rem,6vw,5rem)]">
      <div className="container container--full">
        <nav className="crumbs pt-[clamp(1rem,2.2vh,1.5rem)]" aria-label="Breadcrumb">
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

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--line,#e4d8c6)] py-4 pb-5">
          <div>
            <p className="mb-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-[var(--copper,#8c4435)] uppercase">Search</p>
            <h1 className="m-0 font-[family-name:var(--font-display,inherit)] text-[clamp(1.35rem,2.2vw,1.85rem)] leading-[1.2] font-medium text-[var(--ink,#241f1b)]" id="search-heading">
              {hasQuery ? (
                <>
                  Results for <em className="font-normal text-[var(--copper,#8c4435)] italic">“{trimmed}”</em>
                </>
              ) : (
                "Find a fragrance"
              )}
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-[var(--ink-2,#6b5f53)]" aria-live="polite">
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
            <Link className="text-[0.68rem] font-semibold tracking-[0.1em] text-[var(--copper,#8c4435)] uppercase underline! underline-offset-[3px]" href="/search">
              Clear
            </Link>
          ) : null}
        </header>

        {hasQuery && !tooShortQuery && (products.length || isFetching) ? (
          <div className={`${toolbar} py-4 pb-[1.15rem]`}>
            <p className={catalogCount} aria-live="polite">
              {isLoading
                ? "Searching the catalog…"
                : `Showing ${products.length} of ${total.toLocaleString()}`}
            </p>
            <label className={catalogSort}>
              <span className={catalogSortLabel}>Sort</span>
              <select
                className={catalogSortSelect}
                style={catalogSortSelectStyle}
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
          <div className="mx-auto flex max-w-[460px] flex-col items-center px-4 pt-10 text-center">
            <p className={emptyEyebrow}>Unavailable</p>
            <h2 className={emptyTitle}>Search didn’t load.</h2>
            <p className={emptyText}>Check your connection, then try again.</p>
            <button type="button" className={emptyCta} onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : isLoading && hasQuery && !tooShortQuery ? (
          <p className="m-0 pt-10 text-[0.9rem] text-[var(--ink-2,#6b5f53)]" role="status">
            Searching the catalog…
          </p>
        ) : cards.length ? (
          <section className="products-band" aria-labelledby="search-heading">
            <WishlistStatusScope>
              <ul className="product-grid gap-x-[clamp(0.85rem,1.4vw,1.35rem)] gap-y-[clamp(1.25rem,2vw,2rem)] ![grid-template-columns:repeat(4,minmax(0,1fr))] max-[1080px]:![grid-template-columns:repeat(3,minmax(0,1fr))] max-[720px]:![grid-template-columns:repeat(2,minmax(0,1fr))]" role="list">
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
    <div>
      <div className="mx-auto flex max-w-[460px] flex-col items-center px-4 pt-8 pb-6 text-center">
        <p className={emptyEyebrow}>{query ? "No matches" : "Start here"}</p>
        <h2 className={emptyTitle}>
          {query ? `Nothing matched “${query}”.` : "Search the collection."}
        </h2>
        <p className={emptyText}>
          {query
            ? "Try a shorter spelling, a note, or a SKU. Or browse what’s new."
            : "Type a name, note, or SKU in the header, or jump to a destination below."}
        </p>
        <ul className="mt-5 flex list-none flex-wrap justify-center gap-2 p-0" role="list">
          {SEARCH_IDLE_SHORTCUTS.map((item) => (
            <li key={item.href}>
              <Link className="inline-flex min-h-9 items-center rounded-full border border-[var(--line,#d9ccb4)] bg-white px-[0.95rem] text-[0.72rem] font-medium tracking-[0.04em] text-[var(--ink,#241f1b)] no-underline hover:border-[var(--copper,#8c4435)] hover:text-[var(--copper,#8c4435)]" href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <Link className={`${emptyCta} mt-5`} href="/products">
          Browse all fragrances
        </Link>
      </div>

      {newest.length ? (
        <section className="products-band pt-2" aria-labelledby="search-new-in">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="m-0 text-[0.72rem] font-semibold tracking-[0.14em] text-[var(--ink,#241f1b)] uppercase" id="search-new-in">
              New in
            </h2>
            <Link className="text-[0.62rem] font-semibold tracking-[0.1em] text-[var(--copper,#8c4435)] uppercase underline! underline-offset-[3px]" href="/collections/new-launches">See all</Link>
          </div>
          <WishlistStatusScope>
            <ul className="product-grid gap-x-[clamp(0.85rem,1.4vw,1.35rem)] gap-y-[clamp(1.25rem,2vw,2rem)] ![grid-template-columns:repeat(4,minmax(0,1fr))] max-[1080px]:![grid-template-columns:repeat(3,minmax(0,1fr))] max-[720px]:![grid-template-columns:repeat(2,minmax(0,1fr))]" role="list">
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
