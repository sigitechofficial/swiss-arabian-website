"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { PageLoading } from "@/components/ui";
import { ProductCard } from "@/features/home/components/ProductCard";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { catalogKeys, fetchProducts } from "../api/catalog.service";
import type { ProductSummary } from "../types/product";

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

export function CatalogPageView() {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const { data, isLoading, isError, error } = useApiQuery(
    catalogKeys.list(zoneCode),
    () => fetchProducts(zoneCode),
  );

  if (isLoading) return <PageLoading label="Loading fragrances…" />;

  return (
    <section
      className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-10 lg:py-16"
      aria-label="Shop products"
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

      {isError ? (
        <p className="mb-6 text-[14px] text-red-600 dark:text-red-400">
          {error?.message || "Could not load the catalog. Please try again."}
        </p>
      ) : null}

      {!isError && (data?.length ?? 0) === 0 ? (
        <p className="text-[14px] text-sa-muted">No products found for this market.</p>
      ) : null}

      <div className="-mx-4 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {(data ?? []).map((product) => {
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
    </section>
  );
}
