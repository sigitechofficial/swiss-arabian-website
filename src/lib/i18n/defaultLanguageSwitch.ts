import { redirect } from "next/navigation";
import { withLocalePrefix } from "./localePath";
import type { LocaleConfig, ShopLocale } from "./locales";

/**
 * A page the admin publishes per language (the homepage, text pages, policies, the FAQ / story /
 * stores pages) that is not published in the language being viewed is shown in the market's
 * default language instead: the address switches to the default language (no mixed page with
 * the default language's content inside another language's site). Temporary, so the language's
 * own address works again as soon as its page is published.
 */

/** Whether content published under `contentLocale` ("en-us", "ar") is in the language `locale` ("en", "ar"). */
export function isPublishedIn(contentLocale: string | null | undefined, locale: ShopLocale): boolean {
  const primary = (value: string) => value.trim().toLowerCase().split(/[-_]/)[0] ?? "";
  return Boolean(contentLocale) && primary(contentLocale!) === primary(locale);
}

/**
 * The address `path` in the market's default language, when the language being viewed is not
 * the default; null when it already is (the default language's page is shown as it is).
 */
export function defaultLanguageAddress(path: string, locale: ShopLocale, config: LocaleConfig): string | null {
  if (locale === config.defaultLocale) return null;
  return withLocalePrefix(path, config.defaultLocale, config);
}

/** Switches to the default language's address (a temporary redirect); does nothing in the default language. */
export function showInDefaultLanguage(path: string, locale: ShopLocale, config: LocaleConfig): void {
  const target = defaultLanguageAddress(path, locale, config);
  if (target) redirect(target);
}
