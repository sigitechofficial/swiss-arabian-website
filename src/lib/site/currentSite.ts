import { parseSiteKey } from "./siteKey";
import { scopedSiteHost, scopedSiteMarketCode } from "./siteScope";

type SiteParamReader = () => Promise<string>;

/**
 * Kept on globalThis: instrumentation, the page bundle and route handlers load
 * separate copies of this module (see storefrontHost.ts). The page tree sets
 * the reader (siteParam.ts); `next/root-params` itself may only be imported there.
 */
const READER = Symbol.for("swissarabian.siteParamReader");

type ReaderGlobal = typeof globalThis & { [READER]?: SiteParamReader };

export function setSiteParamReader(reader: SiteParamReader): void {
  (globalThis as ReaderGlobal)[READER] = reader;
}

/**
 * The website address this render is for (`ksa.swissarabian.com`,
 * `sp.localhost:3045`): the address a route handler set with `withSiteHost`,
 * else the `[site]` root param of the page tree. Null outside both. Server only.
 *
 * Reading a root param keeps pages static: each address is its own
 * prerendered page set, so nothing here reads the request.
 */
export async function currentSiteHost(): Promise<string | null> {
  const scoped = scopedSiteHost();
  if (scoped) return scoped;
  return (await currentSiteKey())?.host ?? null;
}

/**
 * The market this page tree is for on an address that serves several markets
 * (`swissarabian.com~KSA`); null on a market address (its address decides) and
 * outside the page tree. A root param, so pages stay static per market.
 */
export async function currentSiteMarketCode(): Promise<string | null> {
  const scoped = scopedSiteMarketCode();
  if (scoped !== undefined) return scoped;
  return (await currentSiteKey())?.marketCode ?? null;
}

async function currentSiteKey() {
  const reader = (globalThis as ReaderGlobal)[READER];
  if (!reader) return null;
  try {
    return parseSiteKey(await reader());
  } catch {
    // Not inside the `[site]` tree (or inside unstable_cache / a server action).
    return null;
  }
}
