import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocaleSwitchablePath } from "@/lib/i18n/localePath";
import { localeRouting } from "@/lib/i18n/localeRouting";
import { ZONE_COOKIE } from "@/features/markets/utils/zoneCookie";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import {
  matchRedirect,
  redirectHost,
  redirectLocation,
  redirectsFor,
  redirectZone,
} from "@/lib/seo/storedRedirects";

/** Served outside the `[locale]` tree (API proxies in next.config rewrites). */
const PASS_THROUGH = /^\/(?:_next|api|storefront|catalog|webhooks)(?:\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PASS_THROUGH.test(pathname) || pathname.includes(".")) {
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

  // Languages: the default one has no prefix (rewritten to its `[locale]`
  // segment), the others keep `/{locale}/…`.
  const decision = localeRouting({
    pathname,
    searchParams: request.nextUrl.searchParams,
    switchable: isLocaleSwitchablePath(pathname),
  });
  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  if (decision.search !== undefined) url.search = decision.search;
  if (decision.type === "redirect") return NextResponse.redirect(url, 301);
  if (decision.type === "rewrite") return NextResponse.rewrite(url);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
