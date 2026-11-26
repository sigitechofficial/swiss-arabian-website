"use client";

import { useLocaleConfig, useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { usePathname } from "next/navigation";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { marketPrefixOf } from "@/lib/site/marketLink";
import { servesLocale, type LocaleConfig } from "@/lib/i18n/locales";

/** Where switching to `id` goes from `pathname` (same page, other language); null when it stays put. */
export function languageSwitchPath(
  pathname: string,
  id: string,
  config: LocaleConfig,
): string | null {
  if (!servesLocale(config, id)) return null;
  const current = pathname || "/";
  // A market on the shared address keeps its segment (`/~KWT/ar/x` → `/~KWT/x`).
  const market = marketPrefixOf(current);
  const page = withLocalePrefix(current, id, config);
  const nextPath = market ? `${market}${page === "/" ? "" : page}` : page;
  return nextPath === current ? null : nextPath;
}

/** The page's language and a switch to another one (same page). */
export function useLanguageSwitch() {
  const pathname = usePathname();
  // The page's language (route), also on unprefixed payment return addresses.
  const languageId = useShopLocale();
  const localeConfig = useLocaleConfig();
  const setLanguageId = (id: string) => {
    const nextPath = languageSwitchPath(pathname || "/", id, localeConfig);
    if (!nextPath) return;
    // A client navigation follows the rewritten page and stays on the English
    // address. A full load keeps the language prefix (/ar) in the address bar.
    const search = window.location.search;
    const hash = window.location.hash;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full load required (see above)
    window.location.assign(`${nextPath}${search}${hash}`);
  };
  return { languageId, setLanguageId };
}
