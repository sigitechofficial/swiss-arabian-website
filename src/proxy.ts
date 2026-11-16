import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isLocaleSwitchablePath,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import {
  SHOPPER_LOCALE_COOKIE,
  SHOPPER_LOCALE_MAX_AGE,
} from "@/lib/i18n/shopperLocale";
import { ZONE_COOKIE } from "@/features/markets/utils/zoneCookie";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import {
  matchRedirect,
  redirectHost,
  redirectLocation,
  redirectsFor,
  redirectZone,
} from "@/lib/seo/storedRedirects";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // URL redirects from the admin (imported from Shopify or added by hand),
  // for the market the pages use (market cookie, else the domain's market).
  const host = redirectHost(request.headers);
  if (host) {
    const zone = redirectZone(request.cookies.get(ZONE_COOKIE)?.value);
    const target = matchRedirect(await redirectsFor(host, zone), pathname);
    if (target)
      return NextResponse.redirect(
        redirectLocation(target, request.nextUrl),
        301,
      );
  }

  // Old Shopify URL shapes (nested product URLs, /account/*, /pages/*, /blogs/*).
  const legacyTarget = shopifyLegacyRedirect(pathname);
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 301);
  }

  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const languageParam = request.nextUrl.searchParams.get("languageCode");

  if (
    !isArabic &&
    languageParam &&
    languageParam.toLowerCase().startsWith("ar") &&
    isLocaleSwitchablePath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix(pathname, "ar");
    url.searchParams.delete("languageCode");
    return NextResponse.redirect(url, 301);
  }

  if (isArabic) {
    const stripped = pathname === "/ar" ? "/" : pathname.slice(3) || "/";
    const url = request.nextUrl.clone();
    url.pathname = stripped.startsWith("/") ? stripped : `/${stripped}`;
    const headers = new Headers(request.headers);
    headers.set("x-shop-locale", "ar");
    return rememberLocale(
      request,
      NextResponse.rewrite(url, { request: { headers } }),
      "ar",
    );
  }

  return rememberLocale(
    request,
    NextResponse.next(),
    isLocaleSwitchablePath(pathname) ? "en" : null,
  );
}

/**
 * Shop pages carry the language in the address; checkout and payment pages
 * don't. Remember the language of the last shop page so those pages (and the
 * payment providers they open) follow it. Unchanged values are not re-sent.
 */
function rememberLocale(
  request: NextRequest,
  response: NextResponse,
  locale: "en" | "ar" | null,
): NextResponse {
  if (!locale || request.cookies.get(SHOPPER_LOCALE_COOKIE)?.value === locale) {
    return response;
  }
  response.cookies.set(SHOPPER_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: SHOPPER_LOCALE_MAX_AGE,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
