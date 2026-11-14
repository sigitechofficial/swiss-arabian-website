export type AppEnv = "local" | "dev" | "staging" | "production";

const AZURE_DEV_API =
  "https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io";

const LOCAL_LAN_API = "http://192.168.18.143:3000";

function stripSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property paths
 * (`process.env.NEXT_PUBLIC_FOO`). Dynamic `process.env[key]` breaks the toggle.
 */
function readPublic(value: string | undefined, fallback = ""): string {
  return stripSlash(value ?? fallback);
}

function resolveAppEnv(): AppEnv {
  const value = readPublic(process.env.NEXT_PUBLIC_APP_ENV, "dev");
  if (
    value === "local" ||
    value === "dev" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }
  return "dev";
}

const APP_ENV = resolveAppEnv();

/** `true` → LAN local API; otherwise Azure Dev. */
const USE_LOCAL_API =
  readPublic(process.env.NEXT_PUBLIC_USE_LOCAL_API) === "true";

const LOCAL_API_BASE = readPublic(
  process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL,
  LOCAL_LAN_API,
);
const DEV_API_BASE = readPublic(
  process.env.NEXT_PUBLIC_DEV_API_BASE_URL,
  AZURE_DEV_API,
);

const API_BASE_BY_ENV: Record<AppEnv, string> = {
  local: LOCAL_API_BASE,
  dev: DEV_API_BASE,
  staging: readPublic(
    process.env.NEXT_PUBLIC_STAGING_API_BASE_URL,
    AZURE_DEV_API,
  ),
  production: readPublic(
    process.env.NEXT_PUBLIC_PRODUCTION_API_BASE_URL,
    AZURE_DEV_API,
  ),
};

const RETURN_URL_BY_ENV: Record<AppEnv, string> = {
  local: readPublic(
    process.env.NEXT_PUBLIC_LOCAL_RETURN_URL,
    "http://localhost:3004",
  ),
  dev: readPublic(
    process.env.NEXT_PUBLIC_DEV_RETURN_URL,
    "http://localhost:3004",
  ),
  staging: readPublic(process.env.NEXT_PUBLIC_STAGING_RETURN_URL),
  production: readPublic(process.env.NEXT_PUBLIC_PRODUCTION_RETURN_URL),
};

const resolvedApiBase = USE_LOCAL_API
  ? LOCAL_API_BASE
  : API_BASE_BY_ENV[APP_ENV] || DEV_API_BASE;

/**
 * A blank local base is intentional in the browser: requests stay on
 * `/storefront` and Next rewrites them to the API. Node fetch cannot use
 * that relative URL, so the product page was skipping the catalog call.
 */
const apiBaseUrl =
  resolvedApiBase ||
  (typeof window === "undefined" && USE_LOCAL_API
    ? "http://127.0.0.1:3000"
    : "");

/**
 * Shared / technical settings only. Everything that differs per brand
 * deployment (analytics, Insider, Tabby, Maps, payment switches, catalog
 * media, storefront host, SEO indexing) is read through `getBrand()` /
 * `brandIntegrations()` in src/lib/brand, so no brand inherits another
 * brand's ids (e.g. Swiss Arabian's Insider account).
 */
export const env = {
  appEnv: APP_ENV,
  apiBaseUrl,
  returnUrl: RETURN_URL_BY_ENV[APP_ENV],
  isDev: process.env.NODE_ENV === "development",
  flags: {
    useLocalApi: USE_LOCAL_API,
    mfa: readPublic(process.env.NEXT_PUBLIC_ENABLE_MFA) === "true",
    passwordReset:
      readPublic(process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET, "true") ===
      "true",
    verification:
      readPublic(process.env.NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI) === "true",
    oauth: readPublic(process.env.NEXT_PUBLIC_ENABLE_OAUTH) === "true",
    useDevSession:
      readPublic(process.env.NEXT_PUBLIC_USE_DEV_SESSION) === "true" &&
      process.env.NODE_ENV === "development",
  },
  masterOtp:
    process.env.NODE_ENV === "development"
      ? readPublic(process.env.NEXT_PUBLIC_CUSTOMER_MASTER_OTP)
      : "",
  /**
   * Local only: `*.localhost` aliases to other brands, e.g. `sp=SAPIL@sapil.test`
   * (see lib/storefront/localStorefront.ts). Empty → built-in `sp` = Sapil.
   */
  localStorefronts: readPublic(process.env.NEXT_PUBLIC_LOCAL_STOREFRONTS),
  /**
   * CMS Homepage integration (Phase 2C).
   * Default enabled. Set NEXT_PUBLIC_CMS_HOME_ENABLED=false to force legacy home.
   */
  cmsHomeEnabled:
    readPublic(process.env.NEXT_PUBLIC_CMS_HOME_ENABLED, "true") !== "false",
  /**
   * When CMS has no published Homepage, render the pre-CMS landing composition.
   * Set NEXT_PUBLIC_CMS_HOME_LEGACY_FALLBACK=false for empty/unavailable state only.
   */
  cmsHomeLegacyFallback:
    readPublic(process.env.NEXT_PUBLIC_CMS_HOME_LEGACY_FALLBACK, "true") !==
    "false",
  /**
   * First-party behavior tracking: sends browser events to our own backend
   * (POST /storefront/analytics/events) so history never depends on a third-party SDK.
   * Off unless NEXT_PUBLIC_TRACKING_ENABLED=true. The backend still applies its own
   * enable flag and consent policy.
   */
  /** On-site popups and banners decided by the backend. On unless NEXT_PUBLIC_ONSITE_ENABLED=false. */
  onsite: {
    enabled: readPublic(process.env.NEXT_PUBLIC_ONSITE_ENABLED, "true") !== "false",
  },
  tracking: {
    enabled: readPublic(process.env.NEXT_PUBLIC_TRACKING_ENABLED, "false") === "true",
    /** Seconds of visible time on one page before `engagement_threshold_reached`. */
    engagementSeconds:
      Number.parseInt(
        readPublic(process.env.NEXT_PUBLIC_TRACKING_ENGAGEMENT_SECONDS, "10"),
        10,
      ) || 10,
  },
} as const;
