import type { SitePageListItem } from "../api/sitePages.service";

/**
 * The market's page for a fixed site address among its Pages & policies:
 * the preferred handles in order, then any page whose handle starts with the
 * prefix (stores renamed them, e.g. Qatar's `faqs-1`). Null when none.
 */
export function pickMarketPage(
  pages: readonly SitePageListItem[],
  preferred: readonly string[],
  prefix?: string,
): SitePageListItem | null {
  const own = pages.filter((page) => page.kind === "PAGE");
  for (const handle of preferred) {
    const match = own.find((page) => page.handle === handle);
    if (match) return match;
  }
  if (!prefix) return null;
  return (
    own
      .filter((page) => page.handle.startsWith(prefix))
      .sort((a, b) => a.handle.localeCompare(b.handle))[0] ?? null
  );
}

/** The market's FAQ: `faqs`, `faq`, then any `faq…` page. */
export function pickFaqPage(pages: readonly SitePageListItem[]) {
  return pickMarketPage(pages, ["faqs", "faq"], "faq");
}

/** The market's brand story: `our-story`, `our-story-1`, `about-us`, `about`. */
export function pickStoryPage(pages: readonly SitePageListItem[]) {
  return pickMarketPage(
    pages,
    ["our-story", "our-story-1", "about-us", "about"],
    "our-story",
  );
}

/** The market's store list: `store-locator`, `stores`, `our-stores`, then any `store…` page. */
export function pickStoresPage(pages: readonly SitePageListItem[]) {
  return pickMarketPage(
    pages,
    ["store-locator", "stores", "our-stores", "locator"],
    "store",
  );
}
