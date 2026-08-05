"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/api/queryHooks";
import { PageLoading } from "@/components/ui";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import {
  catalogKeys,
  fetchCollections,
} from "@/features/catalog/api/catalog.service";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";

export function CollectionsPageView() {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const { data, isLoading, isError } = useApiQuery(
    catalogKeys.collections(zoneCode),
    () => fetchCollections(zoneCode),
  );

  if (isLoading) {
    return <PageLoading label="Loading collections…" fill />;
  }

  if (isError || !data?.length) {
    return (
      <CatalogEmptyState
        title="No collections found"
        description="Collections will appear here once they are published for this market."
      />
    );
  }

  return (
    <section
      className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-16"
      aria-label="Collections"
    >
      <header className="mb-8 max-w-[640px] border-b border-sa-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          Curated
        </p>
        <h1 className="mt-2 font-sans text-[32px] font-medium tracking-[-0.02em] text-sa-primary sm:text-[44px] sm:leading-[52px]">
          Collections
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-sa-muted">
          Explore curated fragrance worlds from Swiss Arabian.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((collection) => (
          <article
            key={collection.id}
            className="flex flex-col border border-sa-border bg-surface"
          >
            <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-b from-page to-cream p-6 dark:to-section-soft">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                {collection.productCount != null
                  ? `${collection.productCount} products`
                  : "Collection"}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-sans text-[20px] font-medium tracking-[-0.01em] text-sa-primary">
                {collection.name}
              </h2>
              {collection.description ? (
                <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-sa-muted">
                  {collection.description}
                </p>
              ) : null}
              <Link
                href={`/collections/${collection.slug}`}
                className="mt-auto inline-flex h-[42px] cursor-pointer items-center justify-center border border-sa-border px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-primary transition-colors hover:border-terra hover:text-terra"
              >
                Explore
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
