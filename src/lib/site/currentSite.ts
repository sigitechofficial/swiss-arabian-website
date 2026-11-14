import { hostFromSiteKey } from "./siteKey";
import { scopedSiteHost } from "./siteScope";

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
  const reader = (globalThis as ReaderGlobal)[READER];
  if (!reader) return null;
  try {
    return hostFromSiteKey(await reader());
  } catch {
    // Not inside the `[site]` tree (or inside unstable_cache / a server action).
    return null;
  }
}
