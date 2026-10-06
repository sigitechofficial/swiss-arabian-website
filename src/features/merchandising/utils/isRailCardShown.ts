import type { StorefrontProductCard } from "../types/merch";

export function isRailCardShown(
  card: StorefrontProductCard,
  excludeProductIds: Set<string>,
  excludeSkus: Set<string>,
): boolean {
  if (!card.isSellable) return false;
  if (card.isVisible === false) return false;
  if (excludeProductIds.has(card.productId)) return false;
  if (card.sku && excludeSkus.has(card.sku)) return false;
  return true;
}
