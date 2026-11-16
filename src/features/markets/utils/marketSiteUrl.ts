import { localeFromPathname, stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/localePath";
import { localSiteUrl } from "@/lib/storefront/localStorefront";
import type { StorefrontMarket } from "../types/market";

/** Pages that belong to one market's bag or order: switching market lands on the bag. */
const MARKET_BOUND = /^\/(?:checkout|payments|order-confirmation)(?:\/|$)/;

/**
 * The address on another market's website for the page being read: same page
 * and language (`/ar/products/oud` on `ksa.swissarabian.com`). Checkout and
 * order pages belong to the current market's bag, so they go to the bag there.
 * Null when the market has no website of its own or it is this website.
 */
export function marketSiteUrl(
  market: Pick<StorefrontMarket, "storefrontUrl">,
  current: { origin: string; pathname: string; search: string; hash?: string },
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
  const language = localeFromPathname(current.pathname || "/");
  const bare = stripLocalePrefix(current.pathname || "/") || "/";
  const bound = MARKET_BOUND.test(bare);
  target.pathname = withLocalePrefix(bound ? "/cart" : bare, language);
  if (!bound) {
    target.search = current.search;
    target.hash = current.hash ?? "";
  }
  return target.toString();
}
