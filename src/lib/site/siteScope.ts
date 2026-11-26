import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The website address for code that runs outside the page tree's root params:
 * route handlers (robots.txt, sitemap.xml) receive `[site]` as a param and run
 * their work inside `withSiteHost`, so the API calls they make send that
 * address too. Kept on globalThis: instrumentation and the route bundle load
 * separate copies of this module (see storefrontHost.ts).
 */
const SCOPE = Symbol.for("swissarabian.siteHostScope");

type SiteScope = { host: string; marketCode: string | null };
type ScopeGlobal = typeof globalThis & { [SCOPE]?: AsyncLocalStorage<SiteScope> };

function storage(): AsyncLocalStorage<SiteScope> {
  const g = globalThis as ScopeGlobal;
  if (!g[SCOPE]) g[SCOPE] = new AsyncLocalStorage<SiteScope>();
  return g[SCOPE];
}

/**
 * Runs `fn` with `host` as the current website address, and `marketCode` as its
 * market on an address that serves several (`/~KWT/sitemap.xml` on the shared address).
 */
export function withSiteHost<T>(
  host: string,
  fn: () => Promise<T>,
  marketCode: string | null = null,
): Promise<T> {
  return storage().run({ host, marketCode }, fn);
}

/** The address set by `withSiteHost`, if any. */
export function scopedSiteHost(): string | null {
  return storage().getStore()?.host ?? null;
}

/** The market set by `withSiteHost`: undefined outside a scope, null for none. */
export function scopedSiteMarketCode(): string | null | undefined {
  const scope = storage().getStore();
  return scope ? scope.marketCode : undefined;
}
