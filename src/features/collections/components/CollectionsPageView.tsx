"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppCard, PageLoading } from "@/components/ui";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { catalogKeys, fetchCollections } from "@/features/catalog/api/catalog.service";

export function CollectionsPageView() {
  const { data, isLoading } = useQuery({
    queryKey: catalogKeys.collections(DEFAULT_ZONE_CODE),
    queryFn: () => fetchCollections(DEFAULT_ZONE_CODE),
  });

  if (isLoading) return <PageLoading label="Loading collections…" fill />;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl text-sa-primary">Collections</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((collection) => (
          <Link key={collection.slug} href={`/collections/${collection.slug}`}>
            <AppCard title={collection.name} subtitle={collection.description ?? undefined}>
              <p className="text-sm text-sa-muted">
                {collection.productCount ?? 0} products
              </p>
            </AppCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
