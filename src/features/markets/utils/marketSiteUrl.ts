import { internalLocalePath, localePrefixOf, stripLocalePrefix } from "@/lib/i18n/localePath";
import { localSiteUrl } from "@/lib/storefront/localStorefront";
import { marketLinkUrl } from "@/lib/site/marketLink";
import type { StorefrontMarket } from "../types/market";

/** Pages that belong to one market's bag or order: switching market lands on the bag. */
const MARKET_BOUND = /^\/(?:checkout|payments|order-confirmation)(?:\/|$)/;

type CurrentPage = { origin: string; pathname: string; search: string; hash?: string };

/**
 * The same page and language for another market (`/ar/products/oud`). Checkout and
 * order pages belong to the current market's bag, so they go to the bag there.
 */
function samePageFor(current: CurrentPage): { pathname: string; search: string; hash: string } {
  // The language prefix the shopper is reading in carries over; unprefixed (this
  // market's default) lands on the other market's default language. A language the
  // other market does not serve is sent to its default there (its own proxy).
  const prefix = localePrefixOf(current.pathname || "/");
  const bare = stripLocalePrefix(current.pathname || "/") || "/";
  const bound = MARKET_BOUND.test(bare);
  const path = bound ? "/cart" : bare;
  return {
    pathname: prefix ? internalLocalePath(path, prefix) : path,
    search: bound ? "" : current.search,
    hash: bound ? "" : (current.hash ?? ""),
  };
}

/**
 * The address on another market's website for the page being read: same page
 * and language (`/ar/products/oud` on `ksa.swissarabian.com`). Checkout and
 * order pages belong to the current market's bag, so they go to the bag there.
 * Null when the market has no website of its own or it is this website.
 */
export function marketSiteUrl(
  market: Pick<StorefrontMarket, "storefrontUrl">,
  current: CurrentPage,
): string | null {
  if (!market.storefrontUrl) return null;
  let target: URL;
  try {
    // Locally, the market's public address becomes its local alias (if configured).
    target = new URL(localSiteUrl(market.storefrontUrl, current.origin));
  } catch {
    return null;
  }
  if (target.origin === current.origin) return null;
  const page = samePageFor(current);
  target.pathname = page.pathname;
  target.search = page.search;
  target.hash = page.hash;
  return target.toString();
}

/**
 * Where switching to `market` goes, from another website: its own website (see
 * marketSiteUrl), else — a market the brand's shared address serves — that address
 * opened in the market (`https://swissarabian.com/~KWT/ar/products/oud`). Null when
 * the switch happens on this page (this is that website, or this is the shared
 * address and it serves the market).
 */
export function marketPageUrl(
  market: Pick<StorefrontMarket, "storefrontUrl" | "onSharedAddress" | "zoneCode">,
  sharedSiteUrl: string | null | undefined,
  current: CurrentPage,
): string | null {
  if (market.storefrontUrl) return marketSiteUrl(market, current);
  if (!market.onSharedAddress || !sharedSiteUrl) return null;
  let shared: URL;
  try {
    shared = new URL(localSiteUrl(sharedSiteUrl, current.origin));
  } catch {
    return null;
  }
  if (shared.origin === current.origin) return null;
  return marketLinkUrl(shared.toString(), market.zoneCode, samePageFor(current));
}
