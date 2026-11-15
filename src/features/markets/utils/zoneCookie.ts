import { getBrand } from "@/lib/brand";

/** Swiss Arabian's cookie name, unchanged (shoppers' saved markets keep working). */
const SWISS_ARABIAN_ZONE_COOKIE = "sa-zone-code";
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The market cookie's name for a brand. Cookies are shared by every port of
 * a host (localhost:3045 and :3046) and by sibling deployments on one domain,
 * so each brand keeps its own: Swiss Arabian `sa-zone-code`, others
 * `<brand>-zone-code` (Sapil: `sapil-zone-code`).
 */
export function zoneCookieName(brandCode: string): string {
  if (brandCode === "SWISS_ARABIAN") return SWISS_ARABIAN_ZONE_COOKIE;
  const slug = brandCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `${slug}-zone-code` : SWISS_ARABIAN_ZONE_COOKIE;
}

/** This deployment's market cookie (the brand is fixed per build). */
export const ZONE_COOKIE = zoneCookieName(getBrand().code);

export function readZoneCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ZONE_COOKIE}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]).trim() : "";
  return value || null;
}

/**
 * The market a shopper chose with the picker, kept on the brand's domain
 * (`Domain=swissarabian.com`) so the brand's root domain can send them back to
 * it. Separate from the per-address cookie above: market websites never read it
 * (their address decides the market).
 */
export function marketChoiceCookieName(brandCode: string): string {
  return zoneCookieName(brandCode).replace(/-zone-code$/, "-market-choice");
}

/** This deployment's market choice cookie. */
export const MARKET_CHOICE_COOKIE = marketChoiceCookieName(getBrand().code);

/**
 * The `Domain` a choice is kept on: the brand's domain from the backend address
 * table, only when this page's address is that domain or under it (a browser
 * would refuse anything else). Null = this address only (e.g. local aliases).
 */
export function choiceCookieDomain(
  brandDomain: string | null | undefined,
  pageHost: string,
): string | null {
  const domain = brandDomain?.trim().toLowerCase().replace(/^\./, "") ?? "";
  const host = pageHost.trim().toLowerCase().replace(/:\d+$/, "");
  if (!domain || domain.endsWith("localhost")) return null;
  return host === domain || host.endsWith(`.${domain}`) ? domain : null;
}

/** The cookie line that keeps a market choice (pure, for tests). */
export function marketChoiceCookie(
  zoneCode: string,
  options: { brandDomain: string | null | undefined; pageHost: string; secure: boolean },
): string {
  const domain = choiceCookieDomain(options.brandDomain, options.pageHost);
  return [
    `${MARKET_CHOICE_COOKIE}=${encodeURIComponent(zoneCode)}`,
    "Path=/",
    `Max-Age=${MAX_AGE}`,
    "SameSite=Lax",
    ...(domain ? [`Domain=${domain}`] : []),
    ...(options.secure ? ["Secure"] : []),
  ].join("; ");
}

/** Keep the shopper's market choice for the brand's root domain. */
export function writeMarketChoice(zoneCode: string, brandDomain: string | null | undefined): void {
  if (typeof document === "undefined") return;
  document.cookie = marketChoiceCookie(zoneCode, {
    brandDomain,
    pageHost: window.location.hostname,
    secure: window.location.protocol === "https:",
  });
}

export function writeZoneCookie(zoneCode: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ZONE_COOKIE}=${encodeURIComponent(zoneCode)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

/**
 * A stored market choice, only if it is one of this brand's markets (`zoneCodes`
 * from the markets API). A zone written by another brand on the same host, or a
 * market that no longer exists, is ignored.
 */
export function storedZoneFor(saved: string | null | undefined, zoneCodes: readonly string[]): string | null {
  const zone = saved?.trim() ?? "";
  return zone && zoneCodes.includes(zone) ? zone : null;
}

/**
 * The market of the visitor's current country (from the edge's country header),
 * set by the proxy on every address that offers market switching. Read by the
 * browser to suggest that market when it differs from the one in use. Session
 * cookie, not a choice: the shopper's market is the zone cookie.
 */
export function countryMarketCookieName(brandCode: string): string {
  return zoneCookieName(brandCode).replace(/-zone-code$/, "-country-market");
}

/** This deployment's country market cookie. */
export const COUNTRY_MARKET_COOKIE = countryMarketCookieName(getBrand().code);

/**
 * The country market the shopper said no to ("stay in UAE" while in KSA): that
 * suggestion is not shown again; a different country market is.
 */
export function countryPromptCookieName(brandCode: string): string {
  return zoneCookieName(brandCode).replace(/-zone-code$/, "-country-prompt");
}

/** This deployment's declined-suggestion cookie. */
export const COUNTRY_PROMPT_COOKIE = countryPromptCookieName(getBrand().code);

/** A declined suggestion is remembered for 90 days. */
export const COUNTRY_PROMPT_MAX_AGE = 60 * 60 * 24 * 90;

/** This brand's market cookie lifetime (one year), for the proxy's first-visit cookie. */
export const ZONE_COOKIE_MAX_AGE = MAX_AGE;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  // Cookie names here are fixed `[a-z0-9-]` strings (see the name functions above).
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]).trim() : "";
  return value || null;
}

export function readCountryMarket(): string | null {
  return readCookie(COUNTRY_MARKET_COOKIE);
}

export function readDeclinedCountryMarket(): string | null {
  return readCookie(COUNTRY_PROMPT_COOKIE);
}

/**
 * A market the shopper chose with the picker answers the country suggestion:
 * choosing UAE while in Saudi Arabia means "not KSA", so it is not suggested.
 */
export function answerCountrySuggestion(chosenZoneCode: string): void {
  const country = readCountryMarket();
  if (country && country !== chosenZoneCode) writeDeclinedCountryMarket(country);
}

export function writeDeclinedCountryMarket(zoneCode: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COUNTRY_PROMPT_COOKIE}=${encodeURIComponent(zoneCode)}; Path=/; Max-Age=${COUNTRY_PROMPT_MAX_AGE}; SameSite=Lax${secure}`;
}
