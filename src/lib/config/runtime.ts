/**
 * Settings that differ per environment (dev / staging / production) are read
 * when the server runs, never fixed in the build (deployment plan W4): one image
 * per brand is built once and promoted unchanged from staging to production.
 *
 * Server: `process.env` at runtime (these names are not NEXT_PUBLIC_, so Next.js
 * never inlines them). Browser: the subset it needs, written into each page by
 * the root layout (`runtimeConfigScript`). A page without it (the static 404)
 * gets production behaviour: no test helpers.
 *
 * | Setting               | Who        | Meaning                                                    |
 * |-----------------------|------------|------------------------------------------------------------|
 * | APP_ENV               | both       | local / dev / staging / production                         |
 * | API_BASE_URL          | server     | the backend, for server-side calls and API forwarding      |
 * | SEO_INDEXING_ENABLED  | server     | "true" only on production market websites                  |
 * | STOREFRONT_HOST       | both       | local only: the shop a plain `localhost` stands for        |
 * | LOCAL_STOREFRONTS     | both       | local only: `*.localhost` aliases (`sp=SAPIL@sapil.test`)  |
 * | TRUSTED_EDGE_IDS      | server     | Front Door profile ids (src/lib/site/edge.ts)              |
 * | REDIS_*               | server     | shared page cache (cache-handler.cjs)                      |
 *
 * The browser never calls the backend directly: it uses its own address
 * (`/storefront/…`, `/catalog/…`), which the website forwards (src/proxy.ts).
 */
export type AppEnv = "local" | "dev" | "staging" | "production";

const APP_ENVS: readonly AppEnv[] = ["local", "dev", "staging", "production"];

/** What the browser is given. */
export type BrowserRuntimeConfig = {
  appEnv: AppEnv;
  storefrontHost: string;
  localStorefronts: string;
};

declare global {
  interface Window {
    __SITE_RUNTIME__?: Partial<BrowserRuntimeConfig>;
  }
}

function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export function parseAppEnv(value: string | undefined): AppEnv | null {
  const v = clean(value).toLowerCase();
  return (APP_ENVS as readonly string[]).includes(v) ? (v as AppEnv) : null;
}

const isBrowser = () => typeof window !== "undefined";

/**
 * The environment. Server: APP_ENV (`next dev` without it = local; a server
 * started without it refuses to start, see assertRuntimeConfig). Browser: what
 * the page was given, else production (the safe side: no test helpers).
 */
export function appEnv(): AppEnv {
  if (isBrowser()) return parseAppEnv(window.__SITE_RUNTIME__?.appEnv) ?? "production";
  const parsed = parseAppEnv(process.env.APP_ENV);
  if (parsed) return parsed;
  return process.env.NODE_ENV === "development" ? "local" : "production";
}

/**
 * The backend, for server-side calls (and the website's forwarding of the
 * browser's API calls). Empty in the browser: it calls its own address.
 */
export function apiBaseUrl(): string {
  if (isBrowser()) return "";
  const configured = clean(process.env.API_BASE_URL);
  if (configured) return configured;
  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : "";
}

/** Production market websites only; read when the page is rendered. */
export function seoIndexingEnabled(): boolean {
  return appEnv() === "production" && clean(process.env.SEO_INDEXING_ENABLED) === "true";
}

/** Local only: the shop a plain `localhost` address stands for. */
export function localStorefrontHost(): string {
  const raw = isBrowser() ? window.__SITE_RUNTIME__?.storefrontHost : process.env.STOREFRONT_HOST;
  return clean(raw)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/** Local only: `*.localhost` aliases. */
export function localStorefrontAliases(): string {
  return clean(isBrowser() ? window.__SITE_RUNTIME__?.localStorefronts : process.env.LOCAL_STOREFRONTS);
}

/** The settings written into each page for the browser (server only). */
export function browserRuntimeConfig(): BrowserRuntimeConfig {
  const env = appEnv();
  const local = env === "local";
  return {
    appEnv: env,
    // Local conveniences never reach a deployed website's pages.
    storefrontHost: local ? localStorefrontHost() : "",
    localStorefronts: local ? localStorefrontAliases() : "",
  };
}

/** Inline script for the root layout's <head> (runs before the app's scripts). */
export function runtimeConfigScript(config: BrowserRuntimeConfig = browserRuntimeConfig()): string {
  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  return `window.__SITE_RUNTIME__=${json};`;
}

/**
 * Refuses to start a server whose environment settings are missing or wrong
 * (instrumentation.ts). Skipped while building: a build has no environment.
 */
export function assertRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.NEXT_PHASE === "phase-production-build") return;
  if (env.NODE_ENV === "development") return;
  const problems: string[] = [];
  const target = parseAppEnv(env.APP_ENV);
  if (!target) problems.push(`APP_ENV must be one of ${APP_ENVS.join(", ")}`);
  const api = clean(env.API_BASE_URL);
  if (!api) problems.push("API_BASE_URL is required");
  else if ((target === "staging" || target === "production") && !/^https:\/\//.test(api)) {
    problems.push("API_BASE_URL must be https in staging / production");
  }
  if (target !== "production" && clean(env.SEO_INDEXING_ENABLED) === "true") {
    problems.push("SEO_INDEXING_ENABLED=true is for production only");
  }
  if (target !== "local" && (clean(env.STOREFRONT_HOST) || clean(env.LOCAL_STOREFRONTS))) {
    problems.push("STOREFRONT_HOST / LOCAL_STOREFRONTS are local-only settings");
  }
  if (problems.length) {
    throw new Error(`Website settings: ${problems.join("; ")}.`);
  }
}
