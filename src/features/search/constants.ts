import type { MessageKey } from "@/lib/i18n/messages";

/** Search guide §1.7 — debounce, and never fire below the minimum length. */
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_PAGE_SIZE = 20;
export const SEARCH_RECENT_LIMIT = 5;
export const SEARCH_NEW_IN_SLUG = "new-launches";
export const SEARCH_NEW_IN_LIMIT = 4;

/** Idle (empty-q) shortcuts (`label` is a message key) when the shopper has no recent searches yet. */
export const SEARCH_IDLE_SHORTCUTS = [
  { label: "search.shortcut.oud", href: "/search?q=oud" },
  { label: "search.shortcut.bestSellers", href: "/collections/best-sellers" },
  { label: "search.shortcut.newLaunches", href: "/collections/new-launches" },
  { label: "search.shortcut.giftSets", href: "/collections/gift-sets" },
] as const satisfies readonly { label: MessageKey; href: string }[];

/** Sort choices; `label` is a message key. */
export const SEARCH_SORT_OPTIONS = [
  { value: "newest", label: "search.sortOption.newest" },
  { value: "price_asc", label: "search.sortOption.priceAsc" },
  { value: "price_desc", label: "search.sortOption.priceDesc" },
  { value: "name_asc", label: "search.sortOption.nameAsc" },
  { value: "name_desc", label: "search.sortOption.nameDesc" },
] as const satisfies readonly { value: string; label: MessageKey }[];
