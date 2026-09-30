"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { catalogKeys, fetchCatalogSearch } from "@/features/catalog/api/catalog.service";
import { useUiStore } from "@/stores/useUiStore";

export type GiftCatalogHit = {
  title: string;
  imageUrl: string | null;
  sku: string | null;
};

/** Exact SKU, then the last token of a source id such as shopify:…:803. */
export function matchGiftProduct(
  products: {
    title: string;
    imageUrl?: string | null;
    imageUrls?: string[];
    sku?: string | null;
  }[],
  giftSku: string,
): GiftCatalogHit | null {
  const exact = products.find((product) => product.sku === giftSku);
  const tail = giftSku.split(":").filter(Boolean).pop() ?? "";
  const byTail =
    !exact && tail && tail !== giftSku
      ? products.find((product) => product.sku === tail)
      : undefined;
  const product = exact ?? byTail;
  if (!product?.title?.trim()) return null;
  return {
    title: product.title.trim(),
    imageUrl: product.imageUrl ?? product.imageUrls?.[0] ?? null,
    sku: product.sku ?? null,
  };
}

export function useGiftCatalogMap(skus: string[]): Map<string, GiftCatalogHit> {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const skuKey = skus.map((sku) => sku.trim()).filter(Boolean).join("|");
  const unique = useMemo(
    () => [...new Set(skuKey.split("|").filter(Boolean))],
    [skuKey],
  );

  const results = useQueries({
    queries: unique.map((sku) => ({
      queryKey: [...catalogKeys.search(sku, zoneCode, 1, 5, "newest"), "gift-display"],
      queryFn: () => lookupGiftProduct(zoneCode, sku),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const map = new Map<string, GiftCatalogHit>();
  unique.forEach((sku, index) => {
    const hit = results[index]?.data;
    if (hit) map.set(sku, hit);
  });
  return map;
}

async function lookupGiftProduct(
  zoneCode: string | null | undefined,
  sku: string,
): Promise<GiftCatalogHit | null> {
  const first = await fetchCatalogSearch(zoneCode, {
    q: sku,
    limit: 5,
    onlySellable: false,
  });
  const exact = matchGiftProduct(first.products, sku);
  if (exact) return exact;
  const tail = sku.split(":").filter(Boolean).pop();
  if (!tail || tail === sku) return null;
  const second = await fetchCatalogSearch(zoneCode, {
    q: tail,
    limit: 5,
    onlySellable: false,
  });
  return matchGiftProduct(second.products, sku) ?? matchGiftProduct(second.products, tail);
}
