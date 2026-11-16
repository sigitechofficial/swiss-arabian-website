"use client";

import type { ComponentProps } from "react";
import { CatalogPageView } from "./CatalogPageView";
import { CollectionDetailPageView } from "@/features/collections/components/CollectionDetailPageView";
import { CategoryDetailPageView } from "@/features/collections/components/CategoryDetailPageView";
import { useUrlListingQuery } from "../hooks/useUrlListingQuery";

/**
 * Listing views that read their filters from the address. Pages render them
 * inside <Suspense> whose fallback is the same view for the server's page, so
 * the prerendered HTML already lists the products (crawlable) and the browser
 * then applies ?sort / ?minPrice / ?page.
 */
type WithServerPage<P> = Omit<P, "listingQuery"> & { serverPage: number };

export function CatalogPageViewFromUrl({
  serverPage,
  initialListing,
  ...props
}: WithServerPage<ComponentProps<typeof CatalogPageView>>) {
  const { listingQuery, useServerListing } = useUrlListingQuery(serverPage);
  return (
    <CatalogPageView
      {...props}
      listingQuery={listingQuery}
      initialListing={useServerListing ? initialListing : null}
    />
  );
}

export function CollectionDetailPageViewFromUrl({
  serverPage,
  initialListing,
  ...props
}: WithServerPage<ComponentProps<typeof CollectionDetailPageView>>) {
  const { listingQuery, useServerListing } = useUrlListingQuery(serverPage);
  return (
    <CollectionDetailPageView
      {...props}
      listingQuery={listingQuery}
      initialListing={useServerListing ? initialListing : null}
    />
  );
}

export function CategoryDetailPageViewFromUrl({
  serverPage,
  initialListing,
  ...props
}: WithServerPage<ComponentProps<typeof CategoryDetailPageView>>) {
  const { listingQuery, useServerListing } = useUrlListingQuery(serverPage);
  return (
    <CategoryDetailPageView
      {...props}
      listingQuery={listingQuery}
      initialListing={useServerListing ? initialListing : null}
    />
  );
}
