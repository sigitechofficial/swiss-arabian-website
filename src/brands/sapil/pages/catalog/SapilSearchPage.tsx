"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CatalogSearchSort } from "@/features/catalog/api/catalog.service";
import { SEARCH_MIN_QUERY_LENGTH, useCatalogSearch } from "@/features/search";
import { useNewLaunchesPreview } from "@/features/search/hooks/useNewLaunchesPreview";
import { rememberSearchQuery } from "@/features/search/utils/recentSearches";
import { searchHref } from "@/features/search/utils/searchUrl";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { localizeHref } from "@/lib/i18n/localePath";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Breadcrumbs, Button, Eyebrow, Wrap } from "../../ui";
import { CatalogRoot } from "../../components/catalog/CatalogRoot";
import { InfiniteMore } from "../../components/catalog/InfiniteMore";
import { ListingToolbar } from "../../components/catalog/ListingToolbar";
import { GridMessage, ProductGrid } from "../../components/catalog/ProductGrid";
import { ShopHero } from "../../components/catalog/ShopHero";
import { SapilLocaleLink } from "../../components/product/SapilLocaleLink";

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

/**
 * `/search?q=` built from the shop page (v9 shop with the "Search" context):
 * a search box (v9 `.search-box`), the hero naming the query, a sort-only
 * toolbar and the grid with infinite scroll; "New in" when nothing matched.
 * Results come from the shared `useCatalogSearch`.
 */
export function SapilSearchPage({ query, sort = "newest" }: { query: string; sort?: CatalogSearchSort }) {
  const t = useSapilCopy();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const tooShort = hasQuery && trimmed.length < SEARCH_MIN_QUERY_LENGTH;
  const [draft, setDraft] = useState(trimmed);
  useResetOnChange(trimmed, () => setDraft(trimmed));
  const search = useCatalogSearch(trimmed, { sort, immediate: true, infinite: true });
  const nothing = !hasQuery || tooShort || (!search.isLoading && !search.isError && !search.products.length);
  const newest = useNewLaunchesPreview(nothing, 4);

  useEffect(() => {
    if (trimmed.length >= SEARCH_MIN_QUERY_LENGTH) rememberSearchQuery(trimmed);
  }, [trimmed]);

  const go = (q: string, nextSort: CatalogSearchSort = sort) =>
    router.push(localizeHref(searchHref({ q, sort: nextSort }), pathname));

  const sorts = [
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "price_asc", label: t("catalog.sortPriceAsc") },
    { value: "price_desc", label: t("catalog.sortPriceDesc") },
    { value: "name_asc", label: t("catalog.sortNameAsc") },
    { value: "name_desc", label: t("catalog.sortNameDesc") },
  ];

  return (
    <CatalogRoot>
      <Wrap>
        <Breadcrumbs label={t("content.breadcrumb")}
          LinkComponent={SapilLocaleLink}
          items={
            hasQuery
              ? [{ label: t("catalog.home"), href: "/" }, { label: t("catalog.search"), href: "/search" }, { label: `“${trimmed}”` }]
              : [{ label: t("catalog.home"), href: "/" }, { label: t("catalog.search") }]
          }
        />
        <form
          role="search"
          className="flex items-center gap-[12px] border-b border-sapil-ink pb-[10px] mt-[28px] max-w-[720px]"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) go(draft.trim());
          }}
        >
          <SearchIcon />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("catalog.searchPlaceholder")}
            aria-label={t("catalog.search")}
            className="flex-1 min-w-0 border-0 bg-transparent font-sapil-serif text-[28px] text-sapil-ink outline-none max-600:text-[22px] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {hasQuery ? (
            <Button variant="link" href="/search" LinkComponent={SapilLocaleLink} className="text-[14px]">
              {t("catalog.clearSearch")}
            </Button>
          ) : null}
          <button type="submit" className="sr-only">
            {t("catalog.searchSubmit")}
          </button>
        </form>
        <ShopHero
          kind={t("catalog.searchKind")}
          title={hasQuery ? `“${trimmed}”` : t("catalog.searchTitle")}
          sub={hasQuery ? t("catalog.searchResultsSub") : t("catalog.searchSub")}
          meta={
            tooShort
              ? t("catalog.searchTooShort", { count: SEARCH_MIN_QUERY_LENGTH })
              : hasQuery && search.isLoading
                ? t("catalog.searching")
                : hasQuery && !search.isError
                  ? t("catalog.searchCount", { count: search.total })
                  : undefined
          }
          color="sky"
          images={search.products
            .map((p) => p.imageUrl ?? p.imageUrls?.[0])
            .filter((src): src is string => Boolean(src))
            .slice(0, 3)}
        />
        {hasQuery && !tooShort && search.products.length ? (
          <ListingToolbar
            facets={[]}
            sorts={sorts}
            sort={sort}
            countLabel={t("catalog.count", { shown: search.products.length, total: search.total })}
            onToggle={() => {}}
            onClearFacet={() => {}}
            onClearAll={() => {}}
            onSort={(value) => go(trimmed, value as CatalogSearchSort)}
          />
        ) : null}
        <section aria-label={t("catalog.productsLabel")} className="pb-[104px]">
          {hasQuery && !tooShort && (search.isLoading || search.isError || search.products.length) ? (
            <>
              <ProductGrid
                products={search.products}
                loading={search.isLoading}
                loadFailed={search.isError}
                onRetry={search.refetch}
                empty={null}
              />
              <InfiniteMore
                hasNext={search.hasNextPage}
                loading={search.isFetchingNextPage}
                nextHref={null}
                onLoadMore={search.fetchNextPage}
              />
            </>
          ) : (
            <>
              <div className="grid">
                <GridMessage
                  title={
                    hasQuery && !tooShort ? t("catalog.searchNoMatchTitle", { query: trimmed }) : t("catalog.searchStartTitle")
                  }
                  action={
                    <Button href="/products" LinkComponent={SapilLocaleLink}>
                      {t("catalog.browseAll")}
                    </Button>
                  }
                >
                  {hasQuery && !tooShort ? t("catalog.searchNoMatchBody") : t("catalog.searchStartBody")}
                </GridMessage>
              </div>
              {newest.length ? (
                <div className="mt-[56px]">
                  <Eyebrow className="mb-[20px]">{t("catalog.searchNewIn")}</Eyebrow>
                  <ProductGrid products={newest} empty={null} aboveFold={false} />
                </div>
              ) : null}
            </>
          )}
        </section>
      </Wrap>
    </CatalogRoot>
  );
}
