import { SEARCH_MIN_QUERY_LENGTH, SEARCH_RECENT_LIMIT } from "../constants";

const STORAGE_KEY = "sa-recent-searches";

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map(normalize)
      .filter((item) => item.length >= SEARCH_MIN_QUERY_LENGTH)
      .slice(0, SEARCH_RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function rememberSearchQuery(raw: string): string[] {
  const query = normalize(raw);
  if (query.length < SEARCH_MIN_QUERY_LENGTH) return readRecentSearches();
  const next = [query, ...readRecentSearches().filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(
    0,
    SEARCH_RECENT_LIMIT,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota — recents are best-effort.
  }
  return next;
}
