/**
 * The currency to show cart amounts in: the cart's own totals, else its lines,
 * else the selected market. Never a fixed currency: a Qatar cart is in QAR.
 */
export function cartCurrency(input: {
  totalsCurrency?: string | null;
  lines?: ReadonlyArray<{ currency?: string | null }>;
  marketCurrency?: string | null;
}): string {
  return (
    input.totalsCurrency?.trim() ||
    input.lines?.find((line) => line.currency?.trim())?.currency?.trim() ||
    input.marketCurrency?.trim() ||
    "AED"
  );
}
