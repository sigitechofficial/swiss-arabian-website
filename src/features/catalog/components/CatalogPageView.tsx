"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { ProductCard } from "@/features/home/components/ProductCard";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useMarket } from "@/providers/MarketProvider";
import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchProducts,
} from "../api/catalog.service";
import type { ProductSummary } from "../types/product";
import { CatalogEmptyState } from "./CatalogEmptyState";
import { CatalogPagination } from "./CatalogPagination";

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

export function CatalogPageView() {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));

  const { data, isLoading, isError, isFetching } = useApiQuery(
    catalogKeys.list(zoneCode, page, CATALOG_PAGE_SIZE),
    () => fetchProducts(zoneCode, { page, limit: CATALOG_PAGE_SIZE }),
    { placeholderData: keepPreviousData },
  );

  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  function hrefForPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (isLoading && !data) {
    return <PageLoading label="Loading fragrances…" fill />;
  }

  if (isError || products.length === 0) {
    return <CatalogEmptyState />;
  }

  return (
    <section
      className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-16"
      aria-label="Shop products"
      aria-busy={isFetching}
    >
      <header className="mb-8 max-w-[640px] border-b border-sa-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          Catalog
        </p>
        <h1 className="mt-2 font-sans text-[32px] font-medium tracking-[-0.02em] text-sa-primary sm:text-[44px] sm:leading-[52px]">
          Shop
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-sa-muted">
          Discover oud, musk, and signature Swiss Arabian compositions.
        </p>
      </header>

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
    </section>
  );
}
