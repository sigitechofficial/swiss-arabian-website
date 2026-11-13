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
 * Every NEXT_PUBLIC_* setting whose value differs per brand deployment.
 * Shared/technical switches (API bases, MFA, dev session …) are not listed.
 */
export const BRAND_ENV_KEYS = [
  "NEXT_PUBLIC_STOREFRONT_BRAND_CODE",
  "NEXT_PUBLIC_STOREFRONT_HOST",
  "NEXT_PUBLIC_STAGING_RETURN_URL",
  "NEXT_PUBLIC_PRODUCTION_RETURN_URL",
  "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_GA4_ID",
  "NEXT_PUBLIC_INSIDER_ENABLED",
  "NEXT_PUBLIC_INSIDER_ACCOUNT_ID",
  "NEXT_PUBLIC_INSIDER_SCRIPT_HOST",
  "NEXT_PUBLIC_TABBY_PUBLIC_KEY",
  "NEXT_PUBLIC_TABBY_MERCHANT_CODE",
  "NEXT_PUBLIC_ENABLE_TABBY",
  "NEXT_PUBLIC_ENABLE_TAMARA",
  "NEXT_PUBLIC_ENABLE_PAYMOB",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID",
  "NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL",
  "NEXT_PUBLIC_SEO_INDEXING_ENABLED",
] as const;
export type BrandEnvKey = (typeof BRAND_ENV_KEYS)[number];

/** Raw values of the per-brand settings (undefined = not set). */
export type BrandPublicEnv = Partial<Record<BrandEnvKey | "NEXT_PUBLIC_APP_ENV", string>>;

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

const idList = z.array(z.string().min(1));

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
    /** `/stores` */
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
  /**
   * Public ids that BELONG to this brand. Not used at runtime — the build
   * check uses them to stop another brand's deployment from shipping them.
   * Only non-secret identifiers go here (no API keys).
   */
  ownedIds: z.object({
    gtmIds: idList,
    ga4Ids: idList,
    insiderAccountIds: idList,
    insiderScriptHosts: idList,
    tabbyMerchantCodes: idList,
    tabbyPublicKeys: idList,
    googleMapsMapIds: idList,
  }),
  /** Settings that must be set when NEXT_PUBLIC_APP_ENV=production. */
  requiredInProduction: z.array(z.enum(BRAND_ENV_KEYS)),
  /** Values used when the setting is empty (e.g. Swiss Arabian's UAT Insider account). */
  integrationDefaults: z.object({
    insiderAccountId: z.string().optional(),
    insiderScriptHost: z.string().optional(),
  }),
});

export type BrandConfig = z.infer<typeof brandConfigSchema>;
export type LocalizedText = BrandConfig["name"];

/** Per-brand public integration ids, read from env and validated. */
export type BrandIntegrations = {
  analytics: { gtmId: string | null; ga4Id: string | null };
  insider: { enabled: boolean; accountId: string; scriptHost: string };
  tabby: { publicKey: string; merchantCode: string };
  googleMaps: { apiKey: string; mapId: string };
  /** Checkout providers switched on in this deployment. */
  payments: { paymob: boolean; tabby: boolean; tamara: boolean };
  catalogMediaBaseUrl: string;
  storefrontHost: string;
  returnUrls: { staging: string; production: string };
  seoIndexingEnabled: boolean;
};

/** The active brand: static config + this deployment's integration ids. */
export type ActiveBrand = BrandConfig & { integrations: BrandIntegrations };
