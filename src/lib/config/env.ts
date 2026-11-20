import {
  apiBaseUrl,
  appEnv,
  localStorefrontAliases,
  type AppEnv,
} from "./runtime";

export type { AppEnv };

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property paths
 * (`process.env.NEXT_PUBLIC_FOO`). Dynamic `process.env[key]` breaks the toggle.
 */
function readPublic(value: string | undefined, fallback = ""): string {
  return (value ?? fallback).replace(/\/+$/, "");
}

/**
 * Technical settings. Environment values (appEnv, apiBaseUrl, local aliases)
 * are read when the server runs (src/lib/config/runtime.ts); the flags below
 * are product switches, the same in every environment of a brand's image.
 * Per-market integrations come from the backend (src/lib/site/siteIntegrations.ts).
 */
export const env = {
  /** Read when used: the environment the server runs in (src/lib/config/runtime.ts). */
  get appEnv(): AppEnv {
    return appEnv();
  },
  /** The backend on the server; "" in the browser (it calls its own address). */
  get apiBaseUrl(): string {
    return apiBaseUrl();
  },
  isDev: process.env.NODE_ENV === "development",
  flags: {
    mfa: readPublic(process.env.NEXT_PUBLIC_ENABLE_MFA) === "true",
    passwordReset:
      readPublic(process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET, "true") ===
      "true",
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
  get localStorefronts(): string {
    return localStorefrontAliases();
  },
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
};
