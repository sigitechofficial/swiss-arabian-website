import { parseMoney } from "@/lib/format/money";

/**
 * A product's `priceSummary` as the storefront API sends it on every card, product page,
 * rail, wishlist item and shoppable video (`{ price, currencyCode, hasValidPrice, compareAtPrice }`).
 */
export type ApiPriceSummaryLike = {
  price?: unknown;
  currencyCode?: unknown;
  hasValidPrice?: unknown;
  compareAtPrice?: unknown;
} | null | undefined;

/**
 * The selling price to show, or null — the same rule the backend's cart and checkout use
 * (`snapshot-price.util.ts`): a price only when the market says it is valid AND it is a
 * positive amount. A missing flag is not a price, so a card never offers what the bag refuses.
 */
export function readSellingPrice(summary: ApiPriceSummaryLike, priceValue?: unknown): number | null {
  if (!summary || summary.hasValidPrice !== true) return null;
  const price = parseMoney(priceValue ?? summary.price);
  return price != null && price > 0 ? price : null;
}

/** The summary's currency code ("KWD"), or null when it has none. */
export function readPriceCurrency(summary: ApiPriceSummaryLike): string | null {
  const code = summary?.currencyCode;
  return typeof code === "string" && code.trim() ? code.trim().toUpperCase() : null;
}
