import { defineBrand } from "../defineBrand";

/**
 * Sapil. Placeholders are marked TODO(brand) — fill them before Sapil goes
 * live. With no production host listed, `npm run check:brand` refuses a
 * production Sapil build on purpose.
 */
export const sapil = defineBrand({
  code: "SAPIL",
  themeKey: "sapil",
  defaultLocale: "en",
  // TODO(brand): confirm the Arabic brand name with Sapil.
  name: { en: "Sapil", ar: "سابيل" },
  siteName: { en: "Sapil", ar: "سابيل" },
  hosts: {
    // TODO(brand): Gulf shop domains. sapil.com is Sapil's international Shopify store, not this site.
    production: [],
    staging: ["sapil-website.vercel.app"],
    local: ["sapil.test"],
  },
  logo: {
    src: "/assets/sapil-online-perfume-store.png",
    alt: { en: "Sapil Online Perfume Store", ar: "متجر عطور سابيل أونلاين" },
    width: 195,
    height: 80,
  },
  icons: {
    // TODO(brand): Sapil favicon / app icons.
    favicon: "/assets/sapil-online-perfume-store.png",
    appleTouchIcon: "/assets/sapil-online-perfume-store.png",
    appIcons: [],
  },
  // TODO(brand): Sapil social profiles.
  social: {},
  // Sapil's CMS pages (seeded from Swiss Arabian's, rebranded). Privacy and refund
  // are pages with Arabic text; terms and shipping exist only as policies.
  legal: {
    privacy: "/pages/privacy-policy",
    terms: "/policies/terms-of-service",
    refund: "/pages/refund-policy",
    shipping: "/policies/shipping-policy",
  },
  seo: {
    defaultTitle: { en: "Sapil", ar: "سابيل" },
    // TODO(brand): Sapil's approved default description.
    defaultDescription: {
      en: "Shop Sapil perfumes online.",
      ar: "تسوّق عطور سابيل أونلاين.",
    },
  },
  // TODO(brand): which sections Sapil launches with. The Journal is built from the v9 blog design.
  features: {
    storeLocator: false,
    blog: true,
    loyalty: false,
    subscriptions: false,
    giftBox: false,
    employeeBenefits: false,
  },
  ownedIds: {
    // TODO(brand): Sapil's own GTM / GA4 / Insider / Tabby / Maps ids.
    gtmIds: [],
    ga4Ids: [],
    insiderAccountIds: [],
    insiderScriptHosts: [],
    tabbyMerchantCodes: [],
    tabbyPublicKeys: [],
    googleMapsMapIds: [],
  },
  requiredInProduction: [
    "NEXT_PUBLIC_STOREFRONT_BRAND_CODE",
    "NEXT_PUBLIC_STOREFRONT_HOST",
    "NEXT_PUBLIC_PRODUCTION_RETURN_URL",
  ],
  // No fallbacks: an empty Insider account means Insider stays off for Sapil.
  integrationDefaults: {},
});
