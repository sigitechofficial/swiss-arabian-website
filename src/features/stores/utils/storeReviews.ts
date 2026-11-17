import type { StoreDetail } from "../types";
import { formatMarketDate } from "@/lib/format/marketDate";

/** Reviews shown on a store page: the newest ones that have words (Google order, no picking). */
export function shownReviews(store: Pick<StoreDetail, "reviews">, max = 3) {
  return (store.reviews ?? []).filter((r) => r.text?.trim()).slice(0, max);
}

/**
 * "November 2026" in the page's language and the store's time zone (so server and browser
 * agree); empty when Google gave no date.
 */
export function reviewMonth(iso: string | null, locale: string, timeZone: string): string {
  return formatMarketDate(iso, locale, timeZone, { month: "long", year: "numeric" });
}
