/**
 * The address of a market on the brand's shared address (the address with no
 * market of its own, e.g. `swissarabian.com`): the first path segment is `~` and
 * the market code, `/~KWT/ar/products/oud`. Like a market subfolder, every page of
 * a market the shared address serves lives under it, for everyone (shoppers and
 * search engines alike): the market comes from the address, never from a cookie,
 * so the same address always shows the same market, its prices and its language.
 *
 * The backend writes these for markets without a website of their own (email
 * links, product feeds: `MarketStorefrontUrlsService.marketOnSharedAddress`, same
 * rule). The proxy serves them in that market's page tree; a plain address on the
 * shared address is sent to the visitor's market's one.
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

/** `/~KWT` for `/~KWT/ar/x`, else "" (the segment a path is in, to keep it on links). */
export function marketPrefixOf(pathname: string): string {
  const link = parseMarketLink(pathname || "/");
  return link ? `/${MARKET_LINK_PREFIX}${link.zoneCode}` : "";
}

/** The page without its market segment: `/~KWT/ar/x` → `/ar/x`; other paths unchanged. */
export function withoutMarketSegment(pathname: string): string {
  return parseMarketLink(pathname || "/")?.path ?? (pathname || "/");
}

/** `/~KWT` + page (`/` → `/~KWT`): a page of a market on the shared address. */
export function marketPagePath(zoneCode: string, path: string): string {
  const page = path.startsWith("/") ? path : `/${path}`;
  return `/${MARKET_LINK_PREFIX}${encodeURIComponent(zoneCode.trim())}${page === "/" ? "" : page}`;
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
  target.pathname = marketPagePath(zoneCode, page.pathname);
  target.search = page.search ?? "";
  target.hash = page.hash ?? "";
  return target.toString();
}
