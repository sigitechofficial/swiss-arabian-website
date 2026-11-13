import { locale as localeParam } from "next/root-params";
import { brandDisplayName } from "@/lib/brand";
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

/**
 * The route's locale and its translator (`t(key, values?)`). `{brand}` in a
 * message defaults to this deployment's brand name in the route's language
 * ("Swiss Arabian" / "سويس أرابيان", "Sapil" …), so default page wording never
 * names another brand. A `brand` value passed by the caller wins.
 */
export async function routeTranslator(): Promise<{
  locale: ShopLocale;
  t: Translator;
  brandName: string;
}> {
  const locale = await routeLocale();
  const translate = await getTranslator(locale);
  const brandName = brandDisplayName(locale);
  const t: Translator = (key, values) => translate(key, { brand: brandName, ...values });
  return { locale, t, brandName };
}
