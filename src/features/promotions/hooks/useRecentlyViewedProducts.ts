"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
import { useHydrated } from "@/hooks/useHydrated";
import { useUiStore } from "@/stores/useUiStore";
import { fetchEmptyBag } from "../api/promotions.service";
import type { EmptyBagProduct } from "../types/emptyBag";
import { readViewed } from "../utils/emptyBagMemory";

function asCatalog(product: EmptyBagProduct, currency: string): CatalogProduct | null {
  if (!product.productId || !product.slug) return null;
  const amount = product.amount != null ? Number(product.amount) : NaN;
  return toCatalogProduct({
    id: product.productId,
    slug: product.slug,
    title: product.title,
    price: Number.isFinite(amount) ? amount : null,
    currency,
    imageUrl: product.image,
    imageUrls: product.image ? [product.image] : [],
    sku: product.sku,
    isSellable: true,
    concentration: null,
    houseCollection: null,
    featuredNote: null,
  });
}

/**
 * The shopper's recently viewed products (this browser's history, read after
 * hydration), without the product on screen. Shared by every brand; each draws
 * its own "Recently viewed" row. Nothing until there is history.
 */
export function useRecentlyViewedProducts(excludeProductId: string, limit = 4) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const currency = useUiStore((state) => state.catalogContext?.currencyCode) || "AED";
  const hydrated = useHydrated();
  const ids = useMemo(
    () => (hydrated ? readViewed().filter((id) => id && id !== excludeProductId) : []),
    [hydrated, excludeProductId],
  );

  const query = useQuery({
    queryKey: ["pdp-recently-viewed", zoneCode, ids.join(",")],
    queryFn: () => fetchEmptyBag({ viewedProductIds: ids, scope: "viewed" }),
    enabled: Boolean(zoneCode) && ids.length > 0,
    retry: false,
  });

  const group = query.data?.groups.find((item) => item.id === "viewed");
  const products = (group?.products ?? [])
    .map((product) => asCatalog(product, currency))
    .filter((product): product is CatalogProduct => product != null && product.id !== excludeProductId)
    .slice(0, limit);

  return { products, heading: group?.heading || null };
}
