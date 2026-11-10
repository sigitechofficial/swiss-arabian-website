import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isLocaleSwitchablePath,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import {
  matchRedirect,
  redirectHost,
  redirectLocation,
  redirectsFor,
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

  // URL redirects from the admin (imported from Shopify or added by hand).
  const host = redirectHost(request.headers);
  if (host) {
    const target = matchRedirect(await redirectsFor(host), pathname);
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
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
