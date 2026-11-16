import type { StoreDetail } from "../types";

/** Reviews shown on a store page: the newest ones that have words (Google order, no picking). */
export function shownReviews(store: Pick<StoreDetail, "reviews">, max = 3) {
  return (store.reviews ?? []).filter((r) => r.text?.trim()).slice(0, max);
}

/** "November 2026" in the page's language; empty when Google gave no date. */
export function reviewMonth(iso: string | null, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}
