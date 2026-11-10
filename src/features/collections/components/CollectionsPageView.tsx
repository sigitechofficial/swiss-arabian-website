"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useQuery } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { stripHtml } from "@/features/catalog/utils/catalogHtml";
import {
  catalogKeys,
  fetchCollections,
  type CatalogCollection,
} from "@/features/catalog/api/catalog.service";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";

/**
 * `initial` is the server-rendered list for the request market, so the page
 * (and its links) is in the first HTML search engines read.
 */
export function CollectionsPageView({
  initial,
  title = "Collections",
}: {
  initial?: { zoneCode: string; collections: CatalogCollection[] } | null;
  title?: string;
}) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? initial?.zoneCode ?? "";
  const serverList = initial && initial.zoneCode === zoneCode ? initial.collections : undefined;
  const { data, isLoading } = useQuery({
    queryKey: [...catalogKeys.collections(zoneCode), market?.salesChannelCode ?? ""],
    queryFn: () => fetchCollections(zoneCode, market),
    enabled: Boolean(market),
    initialData: serverList,
  });

  if (!data && (!market || isLoading)) return <PageLoading label="Loading collections…" fill />;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl text-sa-primary">{title}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((collection) => (
          <LocaleLink
            key={collection.slug}
            href={`/collections/${collection.slug}`}
            className="flex h-full flex-col rounded-lg border border-sa-border bg-surface p-6"
          >
            <h2 className="text-lg font-bold text-sa-primary">{collection.name}</h2>
            {/* Descriptions are HTML from the store: show a short plain-text summary. */}
            {stripHtml(collection.description) ? (
              <p className="mt-1 line-clamp-3 text-sm text-sa-secondary">
                {stripHtml(collection.description)}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-sa-muted">{collection.productCount ?? 0} products</p>
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}
