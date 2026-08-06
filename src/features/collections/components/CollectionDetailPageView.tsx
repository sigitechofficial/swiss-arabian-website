"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import CircularProgress from "@mui/material/CircularProgress";
import { PageLoading } from "@/components/ui";
import { InViewItem, Reveal } from "@/components/motion";
import { ProductCard } from "@/features/home/components/ProductCard";
import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchCollectionBySlug,
  fetchCollectionProducts,
  fetchProducts,
} from "@/features/catalog/api/catalog.service";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";
import type { ProductSummary } from "@/features/catalog/types/product";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useApiQuery } from "@/lib/api/queryHooks";
import { brandColors } from "@/theme/designTokens";
import { useMarket } from "@/providers/MarketProvider";
import {
  COLLECTION_PRODUCT_FALLBACK_SLUGS,
  getCollectionHeroConfig,
} from "../constants/collectionHero";
import { CollectionHero } from "./CollectionHero";

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

function toCardModel(product: ProductSummary) {
  return {
    id: product.id,
    name: product.title,
    family: product.subtitle?.trim() || product.sku || "Swiss Arabian",
    price: product.price,
    image: product.imageUrl ?? null,
    slug: product.slug,
    currency: product.currency || "AED",
    variantId: product.variantId,
  };
}

export function CollectionDetailPageView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const allowCatalogFallback = COLLECTION_PRODUCT_FALLBACK_SLUGS.has(slug);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data: collection,
    isLoading: collectionLoading,
    isError: collectionError,
  } = useApiQuery(catalogKeys.collection(slug, zoneCode), () =>
    fetchCollectionBySlug(slug, zoneCode),
  );

  const collectionMissing =
    !collectionLoading && (collectionError || !collection);

  // Filhal: minis / bundles use the full catalog infinite feed.
  const usingFallback = allowCatalogFallback;
  const collectionFeedEnabled = Boolean(collection) && !allowCatalogFallback;

  const catalogFeed = useInfiniteQuery({
    queryKey: [
      ...catalogKeys.infinite(zoneCode, CATALOG_PAGE_SIZE),
      "collection-fallback",
      slug,
    ],
    queryFn: ({ pageParam }) =>
      fetchProducts(zoneCode, { page: pageParam, limit: CATALOG_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      if (pagination.page >= pagination.totalPages) return undefined;
      return pagination.page + 1;
    },
    enabled: allowCatalogFallback,
  });

  const collectionFeed = useInfiniteQuery({
    queryKey: catalogKeys.collectionInfinite(slug, zoneCode, CATALOG_PAGE_SIZE),
    queryFn: ({ pageParam }) =>
      fetchCollectionProducts(slug, zoneCode, {
        page: pageParam,
        limit: CATALOG_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      if (pagination.page >= pagination.totalPages) return undefined;
      return pagination.page + 1;
    },
    enabled: collectionFeedEnabled,
  });

  const feed = usingFallback ? catalogFeed : collectionFeed;

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = feed;

  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const total = data?.pages[0]?.pagination?.total ?? products.length;
  const loadedPages = data?.pages.length ?? 0;

  const tryLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          tryLoadMore();
        }
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [tryLoadMore, products.length]);

  const hero = getCollectionHeroConfig(slug, collection?.name);
  const displayName = collection?.name ?? hero.title;

  if (collectionLoading) {
    return (
      <div className="bg-page">
        <Reveal fade>
          <CollectionHero config={hero} />
        </Reveal>
        <div className="py-16">
          <PageLoading label="Loading collection…" />
        </div>
      </div>
    );
  }

  if (collectionMissing && !allowCatalogFallback) {
    return (
      <div className="bg-page">
        <Reveal fade>
          <CollectionHero config={hero} />
        </Reveal>
        <CatalogEmptyState
          title="Collection not found"
          description="This collection isn’t available for your market yet. Browse the shop or try another collection."
        />
      </div>
    );
  }

  return (
    <div className="bg-page">
      <Reveal fade>
        <CollectionHero config={hero} />
      </Reveal>

      <div className="pt-10">
        <Reveal>
          <CenteredSectionHead
            eyebrow={hero.sectionEyebrow}
            title={
              <>
                Shop <Accent>{hero.sectionAccent}</Accent>
              </>
            }
          />
        </Reveal>
      </div>

      {isLoading && !data ? (
        <div className="py-16">
          <PageLoading label="Loading fragrances…" />
        </div>
      ) : isError || products.length === 0 ? (
        <CatalogEmptyState
          title="No products found"
          description="This collection has no products available right now."
        />
      ) : (
        <section
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pb-14"
          aria-label={displayName}
          aria-busy={isFetchingNextPage}
        >
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-2 text-[12px]"
          >
            <Link
              href="/"
              className="font-semibold text-sa-muted hover:text-sa-primary"
            >
              Home
            </Link>
            <span className="text-sa-muted" aria-hidden>
              /
            </span>
            <Link
              href="/collections"
              className="font-semibold text-sa-muted hover:text-sa-primary"
            >
              Collections
            </Link>
            <span className="text-sa-muted" aria-hidden>
              /
            </span>
            <span className="font-semibold text-sa-primary">{displayName}</span>
          </nav>

          <div className="-mx-4 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {products.map((product) => {
              const status = catalogStatus(product);
              return (
                <InViewItem key={product.id}>
                  <ProductCard
                    product={toCardModel(product)}
                    addDisabled={status != null}
                  />
                </InViewItem>
              );
            })}
          </div>

          <div
            ref={loadMoreRef}
            className="mt-10 flex min-h-20 flex-col items-center justify-center gap-3 border-t border-sa-border pt-8"
            aria-live="polite"
          >
            <p className="text-[13px] text-sa-muted">
              Showing {products.length}
              {total > products.length ? ` of ${total}` : ""} products
            </p>
            {isFetchingNextPage ? (
              <div
                className="flex flex-col items-center gap-3 py-3"
                role="status"
                aria-label="Loading more products"
              >
                <CircularProgress
                  size={28}
                  sx={{ color: brandColors.terra }}
                />
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-terra">
                  Loading…
                </span>
              </div>
            ) : null}
            {!hasNextPage && loadedPages > 0 ? (
              <p className="text-[12px] font-medium text-sa-muted">
                You&apos;ve reached the end
              </p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
