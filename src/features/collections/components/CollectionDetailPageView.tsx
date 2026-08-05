"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { ProductCard } from "@/features/home/components/ProductCard";
import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchCollectionBySlug,
  fetchCollectionProducts,
} from "@/features/catalog/api/catalog.service";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";
import { CatalogPagination } from "@/features/catalog/components/CatalogPagination";
import type { ProductSummary } from "@/features/catalog/types/product";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useMarket } from "@/providers/MarketProvider";

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

function parsePage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function CollectionDetailPageView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const {
    data: collection,
    isLoading: collectionLoading,
    isError: collectionError,
  } = useApiQuery(catalogKeys.collection(slug, zoneCode), () =>
    fetchCollectionBySlug(slug, zoneCode),
  );

  const {
    data: productData,
    isLoading: productsLoading,
    isError: productsError,
    isFetching,
  } = useApiQuery(
    catalogKeys.collectionProducts(slug, zoneCode, page, CATALOG_PAGE_SIZE),
    () =>
      fetchCollectionProducts(slug, zoneCode, {
        page,
        limit: CATALOG_PAGE_SIZE,
      }),
    {
      enabled: Boolean(collection),
      placeholderData: keepPreviousData,
    },
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, slug]);

  function hrefForPage(nextPage: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (collectionLoading) {
    return <PageLoading label="Loading collection…" fill />;
  }

  if (collectionError || !collection) {
    return (
      <CatalogEmptyState
        title="Collection not found"
        description="This collection isn’t available for your market yet. Browse the shop or try another collection."
      />
    );
  }

  const products = productData?.products ?? [];
  const pagination = productData?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const loadingProducts = productsLoading && !productData;

  return (
    <section
      className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-16"
      aria-label={collection.name}
      aria-busy={isFetching}
    >
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-[12px]"
      >
        <Link href="/" className="font-semibold text-sa-muted hover:text-sa-primary">
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
        <span className="font-semibold text-sa-primary">{collection.name}</span>
      </nav>

      <header className="mb-8 max-w-[640px] border-b border-sa-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          Collection
        </p>
        <h1 className="mt-2 font-sans text-[32px] font-medium tracking-[-0.02em] text-sa-primary sm:text-[44px] sm:leading-[52px]">
          {collection.name}
        </h1>
        {collection.description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-sa-muted">
            {collection.description}
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-sa-muted">
            {collection.productCount != null
              ? `${collection.productCount} fragrances in this collection.`
              : "Discover fragrances in this collection."}
          </p>
        )}
      </header>

      {loadingProducts ? (
        <PageLoading label="Loading fragrances…" />
      ) : productsError || products.length === 0 ? (
        <CatalogEmptyState
          title="No products found"
          description="This collection has no products available right now."
        />
      ) : (
        <>
          <div
            className={`-mx-4 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4 ${
              isFetching ? "opacity-70 transition-opacity" : ""
            }`}
          >
            {products.map((product) => {
              const status = catalogStatus(product);
              return (
                <ProductCard
                  key={product.id}
                  product={toCardModel(product)}
                  addDisabled={status != null}
                />
              );
            })}
          </div>

          {pagination ? (
            <CatalogPagination
              page={safePage}
              totalPages={totalPages}
              total={pagination.total}
              hrefForPage={hrefForPage}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
