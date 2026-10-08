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
    stock: line.isSellable === false ? 0 : 1,
    color: "",
  };
}

/** Flat delivery used when the server cart still quotes shipping at 0. */
export const CART_FLAT_SHIPPING = 25;

export function quotedCartShipping(
  merchandise: number,
  quotedShipping?: number | null,
): number {
  const quoted = Number(quotedShipping ?? 0);
  if (Number.isFinite(quoted) && quoted > 0) return quoted;
  return merchandise > 0 ? CART_FLAT_SHIPPING : 0;
}

/** Grand total. Adds flat shipping when the quoted total did not include a fee. */
export function quotedCartTotal(input: {
  merchandise: number;
  quotedTotal?: number | null;
  quotedShipping?: number | null;
  shipping: number;
}): number {
  const quotedTotal = Number(input.quotedTotal);
  if (input.quotedTotal != null && Number.isFinite(quotedTotal)) {
    const already = Number(input.quotedShipping ?? 0);
    const included = Number.isFinite(already) ? already : 0;
    return quotedTotal + Math.max(0, input.shipping - included);
  }
  return input.merchandise + input.shipping;
}

export function cartSnapshotFromLines(
  lines: CartLine[],
  total: number,
  shippingCost = 0,
): InsiderCartSnapshot {
  return {
    total,
    shippingCost,
    items: lines.map((line) => cartLineToInsiderItem(line)),
  };
}
