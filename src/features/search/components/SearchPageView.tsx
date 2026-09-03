"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { InViewItem, Reveal } from "@/components/motion";
import { ProductCard } from "@/features/home/components/ProductCard";
import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";
import { CatalogPagination } from "@/features/catalog/components/CatalogPagination";
import {
  CATALOG_SEARCH_PAGE_SIZE,
  catalogKeys,
  fetchCatalogSearch,
} from "@/features/catalog/api/catalog.service";
import { toProductCardModel } from "@/features/catalog/utils/toProductCardModel";
import type { ProductSummary } from "@/features/catalog/types/product";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useMarket } from "@/providers/MarketProvider";
import { IconSearch } from "@/components/layout/HeaderIcons";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_SORT_OPTIONS,
} from "../constants";
import { parseSearchSort, searchHref } from "../utils/searchUrl";

function catalogStatus(product: ProductSummary): string | null {
  if (product.price == null || product.sellabilityStatus === "PRICE_MISSING") {
    return "Price unavailable";
  }
  if (
    product.sellabilityStatus === "OUT_OF_STOCK" ||
    product.inStock === false
  ) {
    return "Out of stock";
  }
  if (!product.isSellable) return "Unavailable";
  return null;
}

export function SearchPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const qParam = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sort = parseSearchSort(searchParams.get("sort"));
  const canSearch = qParam.length >= SEARCH_MIN_QUERY_LENGTH;

  const [draft, setDraft] = useState(qParam);

  useEffect(() => {
    setDraft(qParam);
  }, [qParam]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim();
      if (next === qParam) return;
      if (next.length > 0 && next.length < SEARCH_MIN_QUERY_LENGTH) return;
      router.replace(searchHref({ q: next, sort }), { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draft, qParam, router, sort]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: catalogKeys.search(
      qParam,
      zoneCode,
      page,
      CATALOG_SEARCH_PAGE_SIZE,
      sort,
    ),
    queryFn: () =>
      fetchCatalogSearch(zoneCode, {
        q: qParam,
        page,
        limit: CATALOG_SEARCH_PAGE_SIZE,
        sort,
        onlySellable: true,
      }),
    enabled: canSearch,
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draft.trim();
    router.replace(searchHref({ q: next, sort }));
  }

  return (
    <div className="bg-page">
      <div className="pt-10">
        <Reveal>
          <CenteredSectionHead
            eyebrow="Catalog"
            title={
              <>
                Search <Accent>Fragrances</Accent>
              </>
            }
          />
        </Reveal>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pt-8 sm:px-6 lg:px-10">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          role="search"
        >
          <label className="flex min-h-11 flex-1 items-center gap-2.5 border border-sa-border bg-cream px-4 py-2 dark:bg-section-soft">
            <IconSearch />
            <span className="sr-only">Search fragrances</span>
            <input
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Oud, musk, SKU…"
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent font-sans text-[14px] text-sa-primary outline-none placeholder:text-sa-muted"
            />
          </label>
          <button
            type="submit"
            className="h-11 bg-terra px-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a25e48]"
          >
            Search
          </button>
        </form>
        <p className="mt-2 text-[12px] text-sa-muted">
          Type at least {SEARCH_MIN_QUERY_LENGTH} characters. Results are for
          your current market only.
        </p>
      </div>

      {!canSearch ? (
        <div className="mx-auto max-w-[1280px] px-4 py-16 text-center sm:px-6 lg:px-10">
          <p className="text-[15px] text-sa-primary">
            Search by fragrance name, brand, or SKU.
          </p>
          <Link
            href="/collections/bundles"
            className="mt-4 inline-block text-[13px] font-medium text-terra hover:underline"
          >
            Browse collections
          </Link>
        </div>
      ) : isLoading && !data ? (
        <div className="py-16">
          <PageLoading label="Searching…" />
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-[1280px] px-4 py-16 text-center sm:px-6 lg:px-10">
          <p className="text-[15px] text-sa-primary">
            {getUserFacingErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 h-11 bg-terra px-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#a25e48]"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <CatalogEmptyState
          title="No products found"
          description={`Nothing matched “${qParam}”. Try another name or SKU, or browse the catalog.`}
        />
      ) : (
        <section
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-10 pt-8 sm:px-6 lg:px-10 lg:pb-14"
          aria-label="Search results"
          aria-busy={isFetching}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-sa-muted">
              {`${pagination?.total ?? products.length} ${(pagination?.total ?? products.length) === 1 ? "result" : "results"} for “${qParam}”`}
            </p>
            <label className="flex items-center gap-2 text-[12px] text-sa-muted">
              Sort
              <select
                value={sort}
                onChange={(event) =>
                  router.replace(
                    searchHref({ q: qParam, sort: event.target.value }),
                  )
                }
                className="h-9 border border-sa-border bg-page px-2 text-[12px] text-sa-primary outline-none"
              >
                {SEARCH_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="-mx-4 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {products.map((product) => {
              const status = catalogStatus(product);
              return (
                <InViewItem key={product.id}>
                  <ProductCard
                    product={toProductCardModel(product)}
                    addDisabled={status != null}
                  />
                </InViewItem>
              );
            })}
          </div>

          {pagination ? (
            <CatalogPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              hrefForPage={(nextPage) =>
                searchHref({ q: qParam, page: nextPage, sort })
              }
            />
          ) : null}
        </section>
      )}
    </div>
  );
}
