/** Search guide §1.7 — debounce, and never fire below the minimum length. */
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_PAGE_SIZE = 20;
export const SEARCH_RECENT_LIMIT = 5;
export const SEARCH_NEW_IN_SLUG = "new-launches";
export const SEARCH_NEW_IN_LIMIT = 4;

/** Idle (empty-q) shortcuts when the shopper has no recent searches yet. */
export const SEARCH_IDLE_SHORTCUTS = [
  { label: "Oud", href: "/search?q=oud" },
  { label: "Best sellers", href: "/collections/best-sellers" },
  { label: "New launches", href: "/collections/new-launches" },
  { label: "Gift sets", href: "/gift-box" },
] as const;

export const SEARCH_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;
