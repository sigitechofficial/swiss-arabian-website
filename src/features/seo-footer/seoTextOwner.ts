import { stripLocalePrefix } from "@/lib/i18n/localePath";

/**
 * Pages that render the SEO text block above the footer themselves (so the
 * layout's market block must not render a second one). A collection page shows
 * the collection's own SEO text, else the market's.
 */
export function pageRendersOwnSeoText(pathname: string): boolean {
  const path = stripLocalePrefix(pathname.replace(/\/+$/, "") || "/");
  // Page N of a collection is served by …/p/N (same page for the shopper).
  return /^\/collections\/[^/]+(\/p\/\d+)?$/.test(path);
}
