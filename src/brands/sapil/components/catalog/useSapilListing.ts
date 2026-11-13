"use client";

import { useCallback, useMemo } from "react";
import type { CatalogListingSource } from "@/features/catalog/api/fetchCatalogListing";
import type { ProductListResult } from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import { useListingNavigation } from "@/features/catalog/hooks/useListingNavigation";
import type { CatalogListingQuery, CatalogListingSort } from "@/features/catalog/types/catalogFacets";
import { useMarketMerchSettings } from "@/features/markets/hooks/useMarketMerchSettings";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { formatSapilPrice } from "../product/productCardModel";
import type { ListingToolbarProps } from "./ListingToolbar";
import {
  bandsInRange,
  buildToolbarFacets,
  clearFacet,
  editBands,
  listingSorts,
  LISTING_FACET_KEYS,
  tierBands,
  toggleFacet,
} from "./listingModel";

/**
 * A Sapil listing (shop, collection, category, price edit) on the shared
 * listing hooks: products and facets (`useCatalogPlp`, infinite pages), filter
 * changes written to the address (`useListingNavigation`), price bands from
 * the market's price-edit tiers (`useMarketMerchSettings`).
 */
export function useSapilListing({
  source,
  listingQuery,
  initialListing,
  initialZoneCode,
  ceiling,
  include,
}: {
  source: CatalogListingSource;
  listingQuery: CatalogListingQuery;
  initialListing?: ProductListResult | null;
  initialZoneCode?: string | null;
  /** price edit: the tier ("Under 99"); every request stays under it */
  ceiling?: number;
  /** facets in the toolbar (default: all the API has) */
  include?: Array<keyof typeof LISTING_FACET_KEYS>;
}) {
  const t = useSapilCopy();
  const locale = useShopLocale();
  const { priceEditTiers } = useMarketMerchSettings();

  // Inside a price edit every request is capped at the tier; price sorts first.
  const query = useMemo<CatalogListingQuery>(
    () =>
      ceiling != null
        ? { ...listingQuery, maxPrice: listingQuery.maxPrice ?? String(ceiling), sort: listingQuery.sort ?? "price_asc" }
        : listingQuery,
    [ceiling, listingQuery],
  );
  const keep = useMemo(() => (ceiling != null ? { under: String(ceiling) } : undefined), [ceiling]);
  const plp = useCatalogPlp(source, query, initialListing, initialZoneCode);
  const nav = useListingNavigation(query, keep);

  const currency =
    plp.facets?.price?.currencyCode || plp.products?.find((p) => p.currency)?.currency || "AED";
  const money = useCallback((n: number) => formatSapilPrice(n, currency, locale), [currency, locale]);

  const bands = useMemo(
    () => (ceiling != null ? editBands(ceiling) : bandsInRange(tierBands(priceEditTiers), plp.facets?.price)),
    [ceiling, plp.facets?.price, priceEditTiers],
  );

  const facets = useMemo(
    () => buildToolbarFacets({ facets: plp.facets, query, bands, ceiling, t, money, include }),
    [bands, ceiling, include, money, plp.facets, query, t],
  );

  const total = plp.pagination?.total ?? plp.products?.length ?? 0;
  const shown = plp.products?.length ?? 0;
  const fromPrice = plp.facets?.price ? Number(plp.facets.price.min) : NaN;

  const toolbar: ListingToolbarProps = {
    facets,
    sorts: listingSorts(t, ceiling != null),
    sort: query.sort ?? "",
    countLabel: plp.products ? t("catalog.count", { shown, total }) : undefined,
    onToggle: (key, value) => nav.patch(toggleFacet(query, key, value, ceiling)),
    onClearFacet: (key) => nav.patch(clearFacet(key, ceiling)),
    onClearAll: () =>
      nav.push({ page: 1, ...(query.sort ? { sort: query.sort } : {}), ...(ceiling != null ? { maxPrice: String(ceiling) } : {}) }),
    onSort: (value) => nav.patch({ sort: (value || undefined) as CatalogListingSort | undefined }),
  };

  const nextHref =
    plp.pagination && plp.pagination.page < plp.pagination.totalPages
      ? `${nav.pathname}?page=${plp.pagination.page + 1}`
      : null;

  return {
    ...plp,
    query,
    toolbar,
    total,
    fromPrice: Number.isFinite(fromPrice) ? fromPrice : null,
    money,
    priceEditTiers,
    nextHref,
    hasFilters: facets.some((f) => f.selected.length > 0),
  };
}
