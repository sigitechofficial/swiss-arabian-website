"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { usePathname, useRouter } from "next/navigation";
import { localizeHref } from "@/lib/i18n/localePath";
import { useEffect, useRef } from "react";
import { trackSearchResultClicked, trackSearchResultsViewed } from "@/lib/analytics/siteEvents";
import { uuidv4 } from "@/lib/analytics/tracker";
import { recommendationIndexForClick } from "@/lib/analytics/useRecommendationTracking";
import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
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
import { crumbs, crumbsList, searchProductGrid } from "@/styles/shopChrome";
import { productsBand } from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";

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
  const t = useShopCopy();
  const locale = useShopLocale();
  const router = useRouter();
  const pathname = usePathname() || "/";
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

  // Search reports: one search per query shown, with its result count; clicks on its results carry its id.
  const searchRef = useRef<{ query: string; id: string } | null>(null);
  useEffect(() => {
    if (!hasQuery || tooShortQuery || isLoading || isError) return;
    if (searchRef.current?.query === trimmed) return;
    searchRef.current = { query: trimmed, id: uuidv4() };
    trackSearchResultsViewed(searchRef.current.id, trimmed, total);
  }, [trimmed, hasQuery, tooShortQuery, isLoading, isError, total]);

  // The page's number format with Latin digits, like prices across the site.
  const numbers = new Intl.NumberFormat(intlLocale(locale), { numberingSystem: "latn" });
  const countLabel = t("catalog.productCount", { count: total });

  return (
    <div className="bg-[var(--cream,#faf6ee)] pb-[clamp(3rem,6vw,5rem)]">
      <div className={pageContainer}>
        <nav className={crumbs} aria-label={t("account.breadcrumbNav")}>
          <ol className={crumbsList} role="list">
            <li>
              <LocaleLink href="/">{t("home")}</LocaleLink>
            </li>
            {hasQuery ? (
              <>
                <li>
                  <LocaleLink href="/search">{t("nav.search")}</LocaleLink>
                </li>
                <li aria-current="page">“{trimmed}”</li>
              </>
            ) : (
              <li aria-current="page">{t("nav.search")}</li>
            )}
          </ol>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--line,#e4d8c6)] py-4 pb-5">
          <div>
            <p className="mb-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-[var(--copper,#8c4435)] uppercase">{t("nav.search")}</p>
            <h1 className="m-0 font-[family-name:var(--font-display,inherit)] text-[clamp(1.35rem,2.2vw,1.85rem)] leading-[1.2] font-medium text-[var(--ink,#241f1b)]" id="search-heading">
              {hasQuery ? (
                <TextWithLinks
                  text={t("search.resultsFor", linkSlots(["query"]))}
                  links={{ query: <em className="font-normal text-[var(--copper,#8c4435)] italic">“{trimmed}”</em> }}
                />
              ) : (
                t("search.find")
              )}
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-[var(--ink-2,#6b5f53)]" aria-live="polite">
              {tooShortQuery
                ? t("search.tooShort", { count: SEARCH_MIN_QUERY_LENGTH })
                : isError
                  ? t("search.unreachable")
                  : hasQuery && !isLoading
                    ? products.length
                      ? countLabel
                      : t("search.noMatches")
                    : hasQuery && isLoading
                      ? t("search.searching")
                      : t("search.hint")}
            </p>
          </div>
          {hasQuery ? (
            <LocaleLink className="text-[0.68rem] font-semibold tracking-[0.1em] text-[var(--copper,#8c4435)] uppercase underline! underline-offset-[3px]" href="/search">
              {t("search.clear")}
            </LocaleLink>
          ) : null}
        </header>

        {hasQuery && !tooShortQuery && (products.length || isFetching) ? (
          <div className={`${toolbar} py-4 pb-[1.15rem]`}>
            <p className={catalogCount} aria-live="polite">
              {isLoading
                ? t("search.searchingCatalog")
                : t("search.showing", { shown: numbers.format(products.length), total: numbers.format(total) })}
            </p>
            <label className={catalogSort}>
              <span className={catalogSortLabel}>{t("search.sort")}</span>
              <select
                className={catalogSortSelect}
                style={catalogSortSelectStyle}
                value={sort}
                onChange={(event) => {
                  router.push(
                    localizeHref(
                      searchHref({
                        q: trimmed,
                        sort: event.target.value as CatalogSearchSort,
                      }),
                      pathname,
                    ),
                  );
                }}
              >
                {SEARCH_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {isError ? (
          <div className="mx-auto flex max-w-[460px] flex-col items-center px-4 pt-10 text-center">
            <p className={emptyEyebrow}>{t("cart.unavailable.UNAVAILABLE")}</p>
            <h2 className={emptyTitle}>{t("search.loadFailed")}</h2>
            <p className={emptyText}>{t("search.loadFailedBody")}</p>
            <button type="button" className={emptyCta} onClick={() => void refetch()}>
              {t("tryAgain")}
            </button>
          </div>
        ) : isLoading && hasQuery && !tooShortQuery ? (
          <p className="m-0 pt-10 text-[0.9rem] text-[var(--ink-2,#6b5f53)]" role="status">
            {t("search.searchingCatalog")}
          </p>
        ) : cards.length ? (
          <section
            className={productsBand}
            aria-labelledby="search-heading"
            onClickCapture={(event) => {
              const search = searchRef.current;
              const target = event.target instanceof Element ? event.target : null;
              if (!search || !target) return;
              const index = recommendationIndexForClick(target, event.currentTarget, cards);
              if (index >= 0) trackSearchResultClicked(search.id, cards[index], index + 1);
            }}
          >
            <WishlistStatusScope>
              <ul className={searchProductGrid} role="list">
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
  const t = useShopCopy();
  return (
    <div>
      <div className="mx-auto flex max-w-[460px] flex-col items-center px-4 pt-8 pb-6 text-center">
        <p className={emptyEyebrow}>{query ? t("search.empty.noMatches") : t("search.empty.start")}</p>
        <h2 className={emptyTitle}>
          {query ? t("search.empty.nothing", { query }) : t("search.empty.title")}
        </h2>
        <p className={emptyText}>
          {query
            ? t("search.empty.tryShorter")
            : t("search.empty.typeHint")}
        </p>
        <ul className="mt-5 flex list-none flex-wrap justify-center gap-2 p-0" role="list">
          {SEARCH_IDLE_SHORTCUTS.map((item) => (
            <li key={item.href}>
              <LocaleLink className="inline-flex min-h-9 items-center rounded-full border border-[var(--line,#d9ccb4)] bg-white px-[0.95rem] text-[0.72rem] font-medium tracking-[0.04em] text-[var(--ink,#241f1b)] no-underline hover:border-[var(--copper,#8c4435)] hover:text-[var(--copper,#8c4435)]" href={item.href}>{t(item.label)}</LocaleLink>
            </li>
          ))}
        </ul>
        <LocaleLink className={`${emptyCta} mt-5`} href="/products">
          {t("search.browseAll")}
        </LocaleLink>
      </div>

      {newest.length ? (
        <section className="pt-2 pb-[clamp(1rem,2.5vw,1.5rem)]" aria-labelledby="search-new-in">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="m-0 text-[0.72rem] font-semibold tracking-[0.14em] text-[var(--ink,#241f1b)] uppercase" id="search-new-in">
              {t("search.newIn")}
            </h2>
            <LocaleLink className="text-[0.62rem] font-semibold tracking-[0.1em] text-[var(--copper,#8c4435)] uppercase underline! underline-offset-[3px]" href="/collections/new-launches">{t("search.seeAll")}</LocaleLink>
          </div>
          <WishlistStatusScope>
            <ul className={searchProductGrid} role="list">
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
