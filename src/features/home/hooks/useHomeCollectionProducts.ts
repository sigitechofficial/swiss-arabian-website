"use client";

import { useQuery } from "@tanstack/react-query";
import {
  catalogKeys,
  fetchCollectionProducts,
} from "@/features/catalog/api/catalog.service";
import {
  imagesSettled,
  useLoadedImages,
} from "@/features/catalog/hooks/useLoadedImages";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { STATIC_PRODUCTS } from "../constants/staticProducts";

/**
 * Homepage strip for one catalog collection.
 *
 * Waits for the selected market, then reads that collection in its own order.
 * Catalog photos that fail to load are dropped. If nothing usable comes back,
 * the strip keeps the hand-picked bottles so the row does not go blank.
 */
export function useHomeCollectionProducts(slug: string, limit = 8) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const filters = { page: 1 as const, limit };

  const query = useQuery({
    queryKey: [
      ...catalogKeys.collectionProducts(slug, zoneCode, 1, limit, undefined, filters),
      market?.salesChannelCode ?? "",
    ],
    queryFn: () => fetchCollectionProducts(slug, zoneCode, filters, market),
    enabled: Boolean(market),
    staleTime: 5 * 60_000,
  });

  const candidates = query.data?.products ?? [];
  const candidateImages = candidates.map((product) => product.imageUrl);
  const loadedImages = useLoadedImages(candidateImages);
  const live: ProductSummary[] = candidates
    .filter((product) => product.imageUrl && loadedImages.has(product.imageUrl))
    .slice(0, limit);

  const imagesReady =
    imagesSettled(candidateImages) || live.length >= limit;

  const pending =
    !query.isError &&
    (!market || query.isPending || (candidates.length > 0 && !imagesReady));

  const products = pending ? [] : live.length > 0 ? live : STATIC_PRODUCTS.slice(0, limit);

  return { products, pending, live: !pending && live.length > 0 };
}
