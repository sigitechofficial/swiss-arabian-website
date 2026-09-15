/** Complimentary shipping threshold — matches the v5 cart drawer bar. */
export const FREE_SHIPPING_THRESHOLD = 250;

export function freeShippingProgress(subtotal: number, appliedFree = false) {
  const isFree = appliedFree || (subtotal > 0 && subtotal >= FREE_SHIPPING_THRESHOLD);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = isFree
    ? 100
    : Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return { isFree, remaining, progressPct };
}
