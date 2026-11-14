import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The website address for code that runs outside the page tree's root params:
 * route handlers (robots.txt, sitemap.xml) receive `[site]` as a param and run
 * their work inside `withSiteHost`, so the API calls they make send that
 * address too. Kept on globalThis: instrumentation and the route bundle load
 * separate copies of this module (see storefrontHost.ts).
 */
const SCOPE = Symbol.for("swissarabian.siteHostScope");

type ScopeGlobal = typeof globalThis & { [SCOPE]?: AsyncLocalStorage<string> };

function storage(): AsyncLocalStorage<string> {
  const g = globalThis as ScopeGlobal;
  if (!g[SCOPE]) g[SCOPE] = new AsyncLocalStorage<string>();
  return g[SCOPE];
}

/** Runs `fn` with `host` as the current website address. */
export function withSiteHost<T>(host: string, fn: () => Promise<T>): Promise<T> {
  return storage().run(host, fn);
}

/** The address set by `withSiteHost`, if any. */
export function scopedSiteHost(): string | null {
  return storage().getStore() ?? null;
}
