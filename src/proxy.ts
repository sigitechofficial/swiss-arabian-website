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
import { storefrontHostFromHeaderValues } from "@/lib/api/storefrontHost";
import { normalizeSiteHost, siteKeyFromHost } from "@/lib/site/siteKey";
import { lookupSite, marketSiteForVisitor, visitorCountry } from "@/lib/site/siteRegistry";

/** An address no route matches: rewriting to it renders the global 404. */
const FEATURE_OFF_SEGMENT = "_section-off";

/** Served outside the site tree (API proxies in next.config rewrites, route handlers). */
const PASS_THROUGH = /^\/(?:_next|api|storefront|catalog|webhooks)(?:\/|$)/;

/**
 * `/<host.name>[__port]/<more>`: the shape of an address's internal tree.
 * (`/.well-known/…` does not match: a host never starts with a dot.)
 */
const INTERNAL_TREE_PATH = /^\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:__\d{1,5})?\/./i;

/** Per-site files at the root of each address (route handlers under `[site]`). */
const SITE_FILES = new Set(["/robots.txt", "/sitemap.xml"]);

/** The 404 for an address that is not one of the brand's websites. */
function unknownSite(): NextResponse {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PASS_THROUGH.test(pathname)) return NextResponse.next();

  // The address the shopper used decides the website (and its own cached pages).
  const liveHost = normalizeSiteHost(
    storefrontHostFromHeaderValues(
      request.headers.get("x-forwarded-host"),
      request.headers.get("host") || request.nextUrl.host,
    ),
  );
  if (!liveHost) return unknownSite();
  const siteKey = siteKeyFromHost(liveHost);

  // Our own rewrite seen a second time (see INTERNAL_REWRITE_HEADER): serve it,
  // but only for this address's own tree. The header alone proves nothing (any
  // client can send it), so a path for another address is routed afresh.
  if (
    request.headers.get(INTERNAL_REWRITE_HEADER) === "1" &&
    pathname.startsWith(`/${siteKey}/`)
  ) {
    const routePath = pathname.slice(siteKey.length + 1);
    return NextResponse.next({ request: { headers: withLocale(request, routePath) } });
  }

  // An address's internal tree (`/ksa.swissarabian.com/en/…`) is reached only
  // through the rewrite below, never typed: a first segment shaped like a host
  // followed by more path is not a file, so it is refused (another address's
  // pages, or cache entries for made-up addresses).
  if (INTERNAL_TREE_PATH.test(pathname)) return unknownSite();
  if (pathname.includes(".") && !SITE_FILES.has(pathname)) return NextResponse.next();

  // Only addresses in the backend address table are served.
  const storefrontHost = redirectHost(request.headers);
  const lookup = storefrontHost ? await lookupSite(storefrontHost) : { status: "unknown" as const };
  if (lookup.status === "unknown") return unknownSite();
  if (lookup.status === "unavailable") {
    return new NextResponse("Service unavailable", {
      status: 503,
      headers: { "retry-after": "30", "cache-control": "no-store" },
    });
  }
  const site = lookup.site;
  const zoneCookie = redirectZone(request.cookies.get(ZONE_COOKIE)?.value);

  // robots.txt / sitemap.xml belong to each address, root domains included
  // (a root domain's robots.txt lists its market websites' sitemaps).
  if (SITE_FILES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${siteKey}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // A brand's root domain (no market of its own) sends the visitor to a market
  // website: the market they chose before, else their country's, else the default.
  // Temporary (307, not cached): the choice depends on the visitor.
  const marketSite = marketSiteForVisitor(site, {
    zoneCode: zoneCookie,
    country: visitorCountry(request.headers),
  });
  if (marketSite) {
    const target = new URL(`${pathname}${request.nextUrl.search}`, marketSite);
    const response = NextResponse.redirect(target, 307);
    response.headers.set("cache-control", "private, no-store");
    return response;
  }

  // URL redirects from the admin (imported from Shopify or added by hand), for
  // the website's market: a market address decides it, else the market cookie.
  if (storefrontHost) {
    const zone = site.siteMarketCode ? null : zoneCookie;
    const target = matchRedirect(await redirectsFor(storefrontHost, zone), pathname);
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

  // Languages: the default one has no prefix (served from its `[locale]`
  // segment), the others keep `/{locale}/…`.
  const decision = localeRouting({
    pathname,
    searchParams: request.nextUrl.searchParams,
    switchable: isLocaleSwitchablePath(pathname),
  });
  const url = request.nextUrl.clone();
  if (decision.type === "redirect") {
    url.pathname = decision.pathname;
    if (decision.search !== undefined) url.search = decision.search;
    return NextResponse.redirect(url, 301);
  }
  const forwarded = withLocale(request, decision.pathname);
  forwarded.set(INTERNAL_REWRITE_HEADER, "1");
  if (decision.search !== undefined) url.search = decision.search;
  // A section this brand has switched off (brand `features`): the server-rendered
  // 404 (app/global-not-found.tsx: the brand's chrome, status 404), also for
  // sign-in-only pages whose own notFound() would only show after sign-in.
  if (!brandLinkEnabled(pathname)) {
    url.pathname = `/${siteKey}/${localeFromPathname(decision.pathname)}/${FEATURE_OFF_SEGMENT}`;
    url.search = "";
    return NextResponse.rewrite(url, { request: { headers: forwarded } });
  }
  // Every page is served from this address's own tree: `/<site>/<locale>/…`.
  url.pathname = `/${siteKey}${decision.pathname}`;
  return NextResponse.rewrite(url, { request: { headers: forwarded } });
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
