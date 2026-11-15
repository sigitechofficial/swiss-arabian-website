import { cache } from "react";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { fetchStore, fetchStoreArea, fetchStoreLocator } from "../api/storesApi";

/**
 * Store locator data for the request's market and language (market cookie,
 * like the Journal and site pages). Cached per request so metadata and the
 * page share one API call.
 */
const market = cache(async () => {
  const { zoneCode, contentLanguage, locale } = await resolveRequestCatalogMarket();
  return { zoneCode, languageCode: contentLanguage || locale, locale };
});

export const loadStoreLocator = cache(async () => {
  const m = await market();
  return { locale: m.locale, data: await fetchStoreLocator(m) };
});

export const loadStoreArea = cache(async (slug: string) => {
  const m = await market();
  return { locale: m.locale, data: await fetchStoreArea({ ...m, slug }) };
});

export const loadStore = cache(async (slug: string) => {
  const m = await market();
  return { locale: m.locale, store: await fetchStore({ ...m, slug }) };
});
