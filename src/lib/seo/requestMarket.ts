import { routeLocale } from "@/lib/i18n/routeLocale";
import { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";

/**
 * The market this page is drawn for: a market address's own market, else the
 * market of the page tree the proxy chose for the shopper (their saved market,
 * else their first-visit market, else the default). Read from the route, never
 * from the request, so these pages are cached per address and market.
 */
export async function resolveRequestCatalogMarket() {
  return resolveCatalogMarketFor(await routeLocale());
}
