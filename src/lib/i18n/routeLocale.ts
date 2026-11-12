import { locale as localeParam } from "next/root-params";
import { toLocale, type ShopLocale } from "./locales";
import { getTranslator, type Translator } from "./messages";

/**
 * The `[locale]` route segment, readable from any Server Component or server
 * utility without prop drilling (`next/root-params`). Unprefixed addresses are
 * rewritten to the default locale's segment by the proxy.
 */
export async function routeLocale(): Promise<ShopLocale> {
  try {
    return toLocale(await localeParam());
  } catch {
    // Outside a `[locale]` route (route handlers, sitemap): the default locale.
    return toLocale(null);
  }
}

/** The route's locale and its translator (`t(key, values?)`). */
export async function routeTranslator(): Promise<{ locale: ShopLocale; t: Translator }> {
  const locale = await routeLocale();
  return { locale, t: await getTranslator(locale) };
}
