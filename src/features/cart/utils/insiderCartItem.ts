import type { InsiderCartItemPayload, InsiderCartSnapshot } from "@/lib/insider";
import type { CartLine } from "@/stores/useCartStore";

export function productPageUrl(slug: string): string | undefined {
  if (typeof window === "undefined" || !slug) return undefined;
  return `${window.location.origin}/products/${slug}`;
}

export function cartLineToInsiderItem(
  line: CartLine,
  quantity = line.quantity,
): InsiderCartItemPayload {
  return {
    id: line.variantId,
    sku: line.variantId,
    name: line.title,
    price: line.unitPrice,
    currency: line.currency,
    quantity,
    imageUrl: line.imageUrl ?? null,
    productUrl: productPageUrl(line.slug),
    category: null,
    brand: null,
    ...(line.sizeLabel ? { size: line.sizeLabel } : {}),
    ...(line.productId || line.variantId
      ? { groupcode: line.productId || line.variantId }
      : {}),
    ...(line.isSellable === false ? { stock: 0 } : {}),
  };
}

export function cartSnapshotFromLines(
  lines: CartLine[],
  total: number,
): InsiderCartSnapshot {
  return {
    total,
    items: lines.map((line) => cartLineToInsiderItem(line)),
  };
}
