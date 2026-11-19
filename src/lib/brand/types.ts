import { z } from "zod";

/**
 * Design systems the site can render. A new brand either reuses one of these
 * or adds its own key here (and its tokens under src/theme).
 */
export const THEME_KEYS = ["swiss-arabian", "sapil"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export const SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "tiktok",
  "snapchat",
  "youtube",
  "x",
  "linkedin",
  "pinterest",
  "whatsapp",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/**
 * The one setting fixed when a brand's image is built: which brand it is (its
 * design and config are compiled in). Everything that differs per environment
 * is read when the server runs (src/lib/config/runtime.ts), so one image is
 * promoted unchanged from staging to production (deployment plan W4).
 */
export const BRAND_ENV_KEYS = ["NEXT_PUBLIC_STOREFRONT_BRAND_CODE"] as const;
export type BrandEnvKey = (typeof BRAND_ENV_KEYS)[number];

const MOVED_TO_SWITCHBOARD =
  "analytics, Insider's website tag, Tabby / Tamara promos, Google Maps and sign-in are set per market in the admin (Settings → Integrations)";
const MOVED_TO_RUNTIME =
  "environment settings are read when the server runs (APP_ENV, API_BASE_URL, SEO_INDEXING_ENABLED; local only: STOREFRONT_HOST, LOCAL_STOREFRONTS), so one image serves every environment";
const SAME_ORIGIN =
  "the browser calls its own address (/storefront, /catalog, catalog images), which the website forwards to the backend";
const RETURN_FROM_SITE =
  "payment returns go to the market website the shopper is on (checked by the backend)";

/**
 * Settings this website no longer reads, and why. The build check refuses them
 * so a deployment never believes it still sets them.
 */
export const REMOVED_ENV_SETTINGS = {
  NEXT_PUBLIC_GTM_ID: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_GA4_ID: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_INSIDER_ENABLED: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_INSIDER_ACCOUNT_ID: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_INSIDER_SCRIPT_HOST: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_TABBY_PUBLIC_KEY: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_TABBY_MERCHANT_CODE: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_ENABLE_TABBY: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_ENABLE_TAMARA: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_ENABLE_PAYMOB: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_ENABLE_OAUTH: MOVED_TO_SWITCHBOARD,
  NEXT_PUBLIC_APP_ENV: MOVED_TO_RUNTIME,
  NEXT_PUBLIC_STOREFRONT_HOST: MOVED_TO_RUNTIME,
  NEXT_PUBLIC_SEO_INDEXING_ENABLED: MOVED_TO_RUNTIME,
  NEXT_PUBLIC_LOCAL_STOREFRONTS: MOVED_TO_RUNTIME,
  NEXT_PUBLIC_USE_LOCAL_API: SAME_ORIGIN,
  NEXT_PUBLIC_LOCAL_API_BASE_URL: SAME_ORIGIN,
  NEXT_PUBLIC_DEV_API_BASE_URL: SAME_ORIGIN,
  NEXT_PUBLIC_STAGING_API_BASE_URL: SAME_ORIGIN,
  NEXT_PUBLIC_PRODUCTION_API_BASE_URL: SAME_ORIGIN,
  NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL: SAME_ORIGIN,
  NEXT_PUBLIC_LOCAL_RETURN_URL: RETURN_FROM_SITE,
  NEXT_PUBLIC_DEV_RETURN_URL: RETURN_FROM_SITE,
  NEXT_PUBLIC_STAGING_RETURN_URL: RETURN_FROM_SITE,
  NEXT_PUBLIC_PRODUCTION_RETURN_URL: RETURN_FROM_SITE,
} as const;
export const REMOVED_ENV_KEYS = Object.keys(REMOVED_ENV_SETTINGS) as Array<
  keyof typeof REMOVED_ENV_SETTINGS
>;
export type RemovedEnvKey = keyof typeof REMOVED_ENV_SETTINGS;

/** Raw values of the per-brand settings (undefined = not set). */
export type BrandPublicEnv = Partial<Record<BrandEnvKey | RemovedEnvKey, string>>;

/** Brand code: SWISS_ARABIAN, SAPIL, or any future upper-snake code. */
const brandCode = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]*$/, "brand code must be UPPER_SNAKE_CASE");

/** Text per locale (`en`, `ar`, later `fr` …). `en` is always present. */
const localizedText = z
  .record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "locale like en / ar / en-GB"), z.string().min(1))
  .refine((value) => typeof value.en === "string", {
    message: "needs an `en` entry",
  });

/** Hostname only (lowercase, no scheme / port / path). */
const hostname = z
  .string()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/,
    "hostname only: lowercase, no scheme, port or path",
  );

/** Site-relative path (`/assets/x.png`, `/pages/privacy-policy`). */
const sitePath = z.string().regex(/^\/[^\s]*$/, "must start with /");


export const brandConfigSchema = z.object({
  code: brandCode,
  /** Picks the design system (src/theme) — wired up later. */
  themeKey: z.enum(THEME_KEYS),
  defaultLocale: z.string().min(2),
  /** Brand name per locale ("Swiss Arabian" / "سويس أرابيان"). */
  name: localizedText,
  /** Default site name for titles; a market's backend SEO name wins. */
  siteName: localizedText,
  hosts: z.object({
    /** Live shop domains (one per market). */
    production: z.array(hostname),
    /** Staging / dev / preview deployments of this brand. */
    staging: z.array(hostname),
    /** Hosts used only on developer machines (e.g. `sapil.test`). */
    local: z.array(hostname),
  }),
  logo: z.object({
    src: sitePath,
    /** Footer / light-on-dark variant, when the brand has one. */
    footerSrc: sitePath.optional(),
    alt: localizedText,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  icons: z.object({
    favicon: sitePath,
    appleTouchIcon: sitePath,
    appIcons: z.array(
      z.object({ src: sitePath, sizes: z.string().min(1), type: z.string().min(1) }),
    ),
  }),
  social: z.partialRecord(z.enum(SOCIAL_NETWORKS), z.url()),
  /** Policy pages (site paths). */
  legal: z.object({
    privacy: sitePath,
    terms: sitePath,
    refund: sitePath,
    shipping: sitePath,
  }),
  /** Fallback SEO text when the backend has none. */
  seo: z.object({
    defaultTitle: localizedText,
    defaultDescription: localizedText,
  }),
  /**
   * Brand-level switches (whole sections of the site). A section that is off
   * answers "not found" and is never linked: `src/lib/brand/features.ts` maps
   * each switch to its routes.
   */
  features: z.object({
    /** `/store-locator` */
    storeLocator: z.boolean(),
    /** `/blog`, `/blog/[slug]` */
    blog: z.boolean(),
    /** `/account/rewards`, `/account/membership` */
    loyalty: z.boolean(),
    /** `/subscriptions/**`, `/account/subscription/**` */
    subscriptions: z.boolean(),
    /** `/gift-box` */
    giftBox: z.boolean(),
    /** `/account/employee-benefits` (staff benefits from D365) */
    employeeBenefits: z.boolean(),
  }),
  /** Settings that must be set when NEXT_PUBLIC_APP_ENV=production. */
});

export type BrandConfig = z.infer<typeof brandConfigSchema>;
export type LocalizedText = BrandConfig["name"];

/** The active brand: static config + this deployment's integration ids. */
export type ActiveBrand = BrandConfig;
