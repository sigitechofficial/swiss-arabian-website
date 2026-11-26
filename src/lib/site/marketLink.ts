/**
 * A link that opens one market on the brand's shared address (the address with no
 * market of its own, e.g. `swissarabian.com`): the first path segment is `~` and
 * the market code, `/~KWT/ar/account/orders/123`.
 *
 * The backend writes these for markets without a website of their own (email
 * links, product feeds: `MarketStorefrontUrlsService.marketOnSharedAddress`, same
 * rule), and other markets' pickers link to them. The proxy keeps that market for
 * the shopper and sends them on to the same page without the segment, so every
 * page stays at one address and is cached per market as before.
 */
export const MARKET_LINK_PREFIX = "~";

/** `/~<market code>` then the page (or nothing). Codes are `[A-Za-z0-9_-]`. */
const MARKET_LINK = /^\/~([A-Za-z0-9_-]{1,32})(\/.*)?$/;

export type MarketLink = {
  /** The market code as written in the link (compare without case). */
  zoneCode: string;
  /** The page the link opens, without the market segment (`/` when none). */
  path: string;
};

/** The market and page of a market link, or null for any other path. */
export function parseMarketLink(pathname: string): MarketLink | null {
  const match = MARKET_LINK.exec(pathname);
  if (!match) return null;
  return { zoneCode: match[1], path: match[2] || "/" };
}

/**
 * The link that opens `zoneCode` on the shared address at `path` (`/ar/products/oud`):
 * `https://swissarabian.com/~KWT/ar/products/oud`. Query and hash are kept.
 */
export function marketLinkUrl(
  sharedSiteUrl: string,
  zoneCode: string,
  page: { pathname: string; search?: string; hash?: string } = { pathname: "/" },
): string {
  const target = new URL(sharedSiteUrl);
  const path = page.pathname.startsWith("/") ? page.pathname : `/${page.pathname}`;
  target.pathname = `/${MARKET_LINK_PREFIX}${encodeURIComponent(zoneCode.trim())}${path === "/" ? "" : path}`;
  target.search = page.search ?? "";
  target.hash = page.hash ?? "";
  return target.toString();
}
