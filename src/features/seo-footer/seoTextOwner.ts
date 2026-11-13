/**
 * Pages that render the SEO text block above the footer themselves (so the
 * layout's market block must not render a second one). A collection page shows
 * the collection's own SEO text, else the market's.
 */
export function pageRendersOwnSeoText(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return /^(\/ar)?\/collections\/[^/]+$/.test(path);
}
