import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocaleSwitchablePath, localePrefixOf } from "@/lib/i18n/localePath";
import { DEFAULT_LOCALE, localeConfigFromMarket, type LocaleConfig } from "@/lib/i18n/locales";
import {
  INTERNAL_REWRITE_HEADER,
  SHOP_LOCALE_HEADER,
  SHOP_LOCALES_HEADER,
  localeRouting,
} from "@/lib/i18n/localeRouting";
import {
  COUNTRY_MARKET_COOKIE,
  MARKET_CHOICE_COOKIE,
  ZONE_COOKIE,
  ZONE_COOKIE_MAX_AGE,
} from "@/features/markets/utils/zoneCookie";
import { brandLinkEnabled } from "@/lib/brand/features";
import { getBrandConfig } from "@/lib/brand";
import { apiBaseUrl } from "@/lib/config/runtime";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import { productAddressRedirect } from "@/lib/seo/productAddress";
import {
  matchRedirect,
  redirectHost,
  redirectLocation,
  redirectsFor,
  redirectZone,
} from "@/lib/seo/storedRedirects";
import { storefrontHostFromHeaderValues } from "@/lib/api/storefrontHost";
import { normalizeSiteHost, parseSiteKey, siteKeyFromHost, siteTreeKey } from "@/lib/site/siteKey";
import {
  firstVisitMarket,
  lookupSite,
  marketForCountry,
  marketSiteForVisitor,
} from "@/lib/site/siteRegistry";
import { edgeCheck, visitorCountry } from "@/lib/site/edge";

/** An address no route matches: rewriting to it renders the global 404. */
const FEATURE_OFF_SEGMENT = "_section-off";

/** The website's own route handlers and assets, served outside the site tree. */
const PASS_THROUGH = /^\/(?:_next|api)(?:\/|$)/;

/**
 * The backend's paths the browser calls on its own address (API calls, catalog
 * images): forwarded to the backend of this environment (API_BASE_URL, read at
 * runtime), so no backend address is ever built into the website.
 */
const BACKEND_PATHS = /^\/(?:storefront|catalog)(?:\/|$)/;

/**
 * `/<host.name>[__port]/<more>`: the shape of an address's internal tree.
 * (`/.well-known/…` does not match: a host never starts with a dot.)
 */
const INTERNAL_TREE_PATH = /^\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:__\d{1,5})?(?:~[A-Za-z0-9_-]+)?\/./i;

/** Per-site files at the root of each address (route handlers under `[site]`). */
const SITE_FILES = new Set(["/robots.txt", "/sitemap.xml"]);

/** The 404 for an address that is not one of the brand's websites. */
function unknownSite(): NextResponse {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

/** The container's health probe reaches the app directly, not through the edge. */
const HEALTH_PATH = "/api/health";

/** A last path segment that is a file name (`logo.png`, `banner.jpg`). */
const FILE_NAME = /\/[^/]+\.[A-Za-z0-9]{1,8}$/;

/**
 * The website's own public files (`/assets/…`, `/images/logo.png`): the same for
 * every visitor and holding no shopper data, so they are served without the edge
 * check. Next's image optimizer fetches them with an internal request that does
 * not come through Front Door. An address's own files (robots.txt, sitemap.xml)
 * and internal page trees are not public files.
 */
function isPublicFile(pathname: string): boolean {
  return FILE_NAME.test(pathname) && !SITE_FILES.has(pathname) && !INTERNAL_TREE_PATH.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Served only through the hosting edge: its headers (shopper's address,
  // country) are then the edge's own, never a client's (src/lib/site/edge.ts).
  if (pathname !== HEALTH_PATH && !isPublicFile(pathname)) {
    const edge = edgeCheck(request.headers);
    if (edge === "misconfigured") {
      console.error("[proxy] TRUSTED_EDGE_IDS is not set: refusing requests");
      return new NextResponse("Service unavailable", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }
    if (edge === "untrusted") {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
  }
  if (PASS_THROUGH.test(pathname)) return NextResponse.next();
  if (BACKEND_PATHS.test(pathname)) {
    const backend = apiBaseUrl();
    if (!backend) {
      return new NextResponse("Service unavailable", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }
    return NextResponse.rewrite(new URL(`${pathname}${request.nextUrl.search}`, `${backend}/`));
  }

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
  // A market tree (`/swissarabian.com~KSA/…`) only for one of this address's
  // markets, so made-up market segments never become cached pages.
  if (request.headers.get(INTERNAL_REWRITE_HEADER) === "1") {
    const treeKey = pathname.split("/")[1] ?? "";
    const tree = parseSiteKey(treeKey);
    if (
      tree &&
      (treeKey === siteKey || treeKey.startsWith(`${siteKey}~`)) &&
      pathname.startsWith(`/${treeKey}/`) &&
      (!tree.marketCode || (await isMarketTreeOf(liveHost, tree.marketCode)))
    ) {
      const routePath = pathname.slice(treeKey.length + 1);
      return NextResponse.next({ request: { headers: withLocale(request, routePath) } });
    }
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
  // One build per brand: an address of another brand is not this website, even
  // though the backend knows it (a misrouted DNS record or a forged Host must
  // never render another brand's data in this brand's design, or cache it).
  if (site.brandCode.trim().toUpperCase() !== getBrandConfig(liveHost).code) return unknownSite();
  const savedZone = redirectZone(request.cookies.get(ZONE_COOKIE)?.value);
  const country = visitorCountry(request.headers);
  const countryMarket = marketForCountry(site, country);
  // A first visit to an address that serves several markets starts in the
  // visitor's country's market: the page is drawn for it and it is saved like a
  // choice (the shopper can switch; their saved market always wins afterwards).
  const startMarket = firstVisitMarket(site, { savedZone, countryMarket });
  const zoneCookie = savedZone ?? startMarket;
  // The page tree: an address that serves several markets has one per market
  // (the shopper's market, else the default), so its pages are cached per market
  // and read the market from the route, never from the request.
  const offered = (code: string | null) =>
    code && site.markets.some((market) => market.zoneCode === code) ? code : null;
  const treeKey = siteTreeKey(
    liveHost,
    site.siteMarketCode ? null : (offered(zoneCookie) ?? offered(site.defaultMarketCode)),
  );
  const markets: MarketCookies = {
    startMarket,
    countryMarket,
    sentCountryMarket: request.cookies.get(COUNTRY_MARKET_COOKIE)?.value ?? null,
    secure: requestIsHttps(request),
  };

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
  // The choice made with the picker on a market website (kept on the brand's
  // domain), else a choice made on this address itself.
  const marketChoice = redirectZone(request.cookies.get(MARKET_CHOICE_COOKIE)?.value);
  const marketSite = marketSiteForVisitor(site, {
    zoneCode: marketChoice ?? savedZone,
    country,
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

  // A product reached by an old address (its SKU, a former handle): one 308 to its
  // own address, before the page renders (the page's own redirect sends Location
  // twice when it is not cached yet). Same market as the page tree below.
  if (storefrontHost) {
    const productTarget = await productAddressRedirect({
      pathname,
      storefrontHost,
      zoneCode: site.siteMarketCode ?? offered(zoneCookie) ?? offered(site.defaultMarketCode),
    });
    if (productTarget) {
      const url = request.nextUrl.clone();
      url.pathname = productTarget;
      return NextResponse.redirect(url, 308);
    }
  }

  // Languages: the market's own (admin: Markets → languages). Its default has no
  // prefix (served from its `[locale]` segment), the others keep `/{locale}/…`.
  const pageMarketCode =
    site.siteMarketCode ?? offered(zoneCookie) ?? offered(site.defaultMarketCode);
  const pageMarket = site.markets.find((market) => market.zoneCode === pageMarketCode);
  const localeConfig = localeConfigFromMarket(pageMarket?.languages);
  const decision = localeRouting({
    pathname,
    searchParams: request.nextUrl.searchParams,
    switchable: isLocaleSwitchablePath(pathname),
    config: localeConfig,
  });
  const url = request.nextUrl.clone();
  if (decision.type === "redirect") {
    url.pathname = decision.pathname;
    if (decision.search !== undefined) url.search = decision.search;
    if (decision.temporary) {
      const response = NextResponse.redirect(url, 307);
      response.headers.set("cache-control", "private, no-store");
      return response;
    }
    return NextResponse.redirect(url, 301);
  }
  const forwarded = withLocale(request, decision.pathname, localeConfig);
  forwarded.set(INTERNAL_REWRITE_HEADER, "1");
  if (startMarket) withRequestCookie(forwarded, ZONE_COOKIE, startMarket);
  if (decision.search !== undefined) url.search = decision.search;
  // A section this brand has switched off (brand `features`): the server-rendered
  // 404 (app/global-not-found.tsx: the brand's chrome, status 404), also for
  // sign-in-only pages whose own notFound() would only show after sign-in.
  if (!brandLinkEnabled(pathname)) {
    url.pathname = `/${treeKey}/${routeLocaleOf(decision.pathname)}/${FEATURE_OFF_SEGMENT}`;
    url.search = "";
    return withMarketCookies(NextResponse.rewrite(url, { request: { headers: forwarded } }), markets);
  }
  // Every page is served from this address's own tree: `/<site>/<locale>/…`
  // (`/<site>~<market>/<locale>/…` on an address that serves several markets).
  url.pathname = `/${treeKey}${decision.pathname}`;
  return withMarketCookies(NextResponse.rewrite(url, { request: { headers: forwarded } }), markets);
}

/** Whether `marketCode` is one of the markets of an address that serves several. */
async function isMarketTreeOf(host: string, marketCode: string): Promise<boolean> {
  const lookup = await lookupSite(host);
  if (lookup.status !== "known" || lookup.site.siteMarketCode) return false;
  return lookup.site.markets.some((market) => market.zoneCode === marketCode);
}

type MarketCookies = {
  /** The first-visit market to save (null: the visitor has a market, or none fits). */
  startMarket: string | null;
  /** The market of the visitor's current country on this address (null: none). */
  countryMarket: string | null;
  /** The country market cookie the browser sent. */
  sentCountryMarket: string | null;
  secure: boolean;
};

/**
 * Saves a first visit's market and keeps the browser's country market current
 * (read by the market suggestion). Cookies are only written when they change, so
 * repeat visits carry no Set-Cookie (cacheable at the edge).
 */
function withMarketCookies(response: NextResponse, cookies: MarketCookies): NextResponse {
  const base = { path: "/", sameSite: "lax" as const, secure: cookies.secure };
  if (cookies.startMarket) {
    response.cookies.set(ZONE_COOKIE, cookies.startMarket, { ...base, maxAge: ZONE_COOKIE_MAX_AGE });
  }
  if ((cookies.sentCountryMarket || null) !== cookies.countryMarket) {
    if (cookies.countryMarket) response.cookies.set(COUNTRY_MARKET_COOKIE, cookies.countryMarket, base);
    else response.cookies.delete({ name: COUNTRY_MARKET_COOKIE, path: "/" });
  }
  return response;
}

/** Adds (or replaces) a cookie on the request the pages read. */
function withRequestCookie(headers: Headers, name: string, value: string): void {
  const kept = (headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${name}=`));
  headers.set("cookie", [...kept, `${name}=${encodeURIComponent(value)}`].join("; "));
}

/** Whether the shopper's request was https (the edge forwards the original scheme). */
function requestIsHttps(request: NextRequest): boolean {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return (proto || request.nextUrl.protocol.replace(/:$/, "")) === "https";
}

/** The language of an internal route path (always prefixed: `/ar/…`, `/en/…`). */
function routeLocaleOf(routePath: string): string {
  return localePrefixOf(routePath) ?? DEFAULT_LOCALE;
}

/** Request headers plus the address's language (and its market's), for app/global-not-found.tsx. */
function withLocale(request: NextRequest, routePath: string, config?: LocaleConfig): Headers {
  const headers = new Headers(request.headers);
  headers.set(SHOP_LOCALE_HEADER, routeLocaleOf(routePath));
  if (config) headers.set(SHOP_LOCALES_HEADER, config.locales.join(","));
  else headers.delete(SHOP_LOCALES_HEADER);
  return headers;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
