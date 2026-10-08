"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useQuery } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { catalogKeys, fetchCollections } from "@/features/catalog/api/catalog.service";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";

export function CollectionsPageView() {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const { data, isLoading } = useQuery({
    queryKey: [...catalogKeys.collections(zoneCode), market?.salesChannelCode ?? ""],
    queryFn: () => fetchCollections(zoneCode, market),
    enabled: Boolean(market),
  });

  if (!market || isLoading) return <PageLoading label="Loading collections…" fill />;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl text-sa-primary">Collections</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((collection) => (
          <LocaleLink
            key={collection.slug}
            href={`/collections/${collection.slug}`}
            className="flex h-full flex-col rounded-lg border border-sa-border bg-surface p-6"
          >
            <h2 className="text-lg font-bold text-sa-primary">{collection.name}</h2>
            {collection.description ? (
              <p className="mt-1 text-sm text-sa-secondary">{collection.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-sa-muted">{collection.productCount ?? 0} products</p>
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}
