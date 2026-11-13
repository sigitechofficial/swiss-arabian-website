import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocaleSwitchablePath, localeFromPathname } from "@/lib/i18n/localePath";
import {
  INTERNAL_REWRITE_HEADER,
  SHOP_LOCALE_HEADER,
  localeRouting,
} from "@/lib/i18n/localeRouting";
import { ZONE_COOKIE } from "@/features/markets/utils/zoneCookie";
import { brandLinkEnabled } from "@/lib/brand/features";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import {
  matchRedirect,
  redirectHost,
  redirectLocation,
  redirectsFor,
  redirectZone,
} from "@/lib/seo/storedRedirects";

/** An address no route matches: rewriting to it renders the global 404. */
const FEATURE_OFF_SEGMENT = "_section-off";

/** Served outside the `[locale]` tree (API proxies in next.config rewrites). */
const PASS_THROUGH = /^\/(?:_next|api|storefront|catalog|webhooks)(?:\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PASS_THROUGH.test(pathname) || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Our own rewrite seen a second time (see INTERNAL_REWRITE_HEADER): serve it.
  if (request.headers.get(INTERNAL_REWRITE_HEADER) === "1") {
    return NextResponse.next({ request: { headers: withLocale(request, pathname) } });
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
  const forwarded = withLocale(request, decision.pathname);
  // A section this brand has switched off (brand `features`): the server-rendered
  // 404 (app/global-not-found.tsx: the brand's chrome, status 404), also for
  // sign-in-only pages whose own notFound() would only show after sign-in.
  if (!brandLinkEnabled(pathname)) {
    url.pathname = `/${localeFromPathname(decision.pathname)}/${FEATURE_OFF_SEGMENT}`;
    url.search = "";
    forwarded.set(INTERNAL_REWRITE_HEADER, "1");
    return NextResponse.rewrite(url, { request: { headers: forwarded } });
  }
  if (decision.type === "rewrite") {
    forwarded.set(INTERNAL_REWRITE_HEADER, "1");
    return NextResponse.rewrite(url, { request: { headers: forwarded } });
  }
  return NextResponse.next({ request: { headers: forwarded } });
}

/** Request headers plus the address's language, for app/global-not-found.tsx. */
function withLocale(request: NextRequest, routePath: string): Headers {
  const headers = new Headers(request.headers);
  headers.set(SHOP_LOCALE_HEADER, localeFromPathname(routePath));
  return headers;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
