import { cookies } from "next/headers";
import { ZONE_COOKIE } from "@/features/markets/utils/zoneCookie";
import { routeLocale } from "@/lib/i18n/routeLocale";
import { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";

/**
 * The market the shopper chose (market cookie), else the default market.
 * Reading the cookie makes the page dynamic: use it only for content that
 * differs per market and is not refreshed by the browser (site pages,
 * policies, the Journal, offers). Catalog pages use
 * `resolveServerCatalogMarket()` and stay static.
 */
export async function resolveRequestCatalogMarket() {
  const locale = await routeLocale();
  const zoneCookie = (await cookies()).get(ZONE_COOKIE)?.value?.trim() || "";
  return resolveCatalogMarketFor(locale, zoneCookie);
}
