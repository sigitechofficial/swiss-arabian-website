export type ShopLocale = "en" | "ar";

/** Transactional addresses stay unprefixed. Every other shop path keeps the language. */
const UNSWITCHABLE = [
  /^\/checkout(\/|$)/,
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/forgot-password(\/|$)/,
  /^\/reset-password(\/|$)/,
  /^\/verify(\/|$)/,
  /^\/order-confirmation(\/|$)/,
  /^\/track(\/|$)/,
];

export function localeFromPathname(pathname: string): ShopLocale {
  return pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/ar") return "/";
  if (pathname.startsWith("/ar/")) {
    const rest = pathname.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname || "/";
}

export function withLocalePrefix(pathname: string, locale: ShopLocale): string {
  const bare = stripLocalePrefix(pathname);
  if (locale === "en") return bare || "/";
  return bare === "/" ? "/ar" : `/ar${bare}`;
}

export function isLocaleSwitchablePath(pathname: string): boolean {
  const bare = stripLocalePrefix(pathname);
  return !UNSWITCHABLE.some((pattern) => pattern.test(bare));
}

/** Bare shop paths stay in constants. This adds `/ar` only while the customer is in Arabic. */
export function localizeHref(href: string, pathname: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  const withoutHash = hash ? href.slice(0, href.indexOf("#")) : href;
  const query = withoutHash.includes("?") ? withoutHash.slice(withoutHash.indexOf("?")) : "";
  const path = withoutHash.split("?")[0] || "/";
  if (path === "/ar" || path.startsWith("/ar/")) return href;
  if (!isLocaleSwitchablePath(path)) return href;
  return `${withLocalePrefix(path, localeFromPathname(pathname))}${query}${hash}`;
}

export function catalogAlternates(pathname: string, locale: ShopLocale) {
  const bare = stripLocalePrefix(pathname);
  const english = bare || "/";
  const arabic = withLocalePrefix(bare, "ar");
  return {
    canonical: locale === "ar" ? arabic : english,
    languages: {
      en: english,
      ar: arabic,
      "x-default": english,
    },
  };
}
