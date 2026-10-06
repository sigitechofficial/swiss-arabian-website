import { MERCH_RAIL_SLUG_SET } from "../constants";
import type { ProductCollectionRef } from "@/features/catalog/types/product";

export function pickMoreFromCollection(
  collections?: ProductCollectionRef[] | null,
): ProductCollectionRef | null {
  if (!collections?.length) return null;
  const usable = (item: ProductCollectionRef) =>
    Boolean(item.slug) && !MERCH_RAIL_SLUG_SET.has(item.slug);
  return (
    collections.find((item) => item.isFeatured && usable(item)) ??
    collections.find(usable) ??
    collections.find((item) => Boolean(item.slug)) ??
    null
  );
}
