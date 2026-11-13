"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname, withLocalePrefix } from "@/lib/i18n/localePath";
import { isLocale } from "@/lib/i18n/locales";

/** Where switching to `id` goes from `pathname` (same page, other language); null when it stays put. */
export function languageSwitchPath(pathname: string, id: string): string | null {
  if (!isLocale(id)) return null;
  const current = pathname || "/";
  const nextPath = withLocalePrefix(current, id);
  return nextPath === current ? null : nextPath;
}

/** The page's language and a switch to another one (same page). */
export function useLanguageSwitch() {
  const pathname = usePathname();
  const languageId = localeFromPathname(pathname || "/");
  const setLanguageId = (id: string) => {
    const nextPath = languageSwitchPath(pathname || "/", id);
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
