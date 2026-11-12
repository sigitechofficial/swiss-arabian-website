import { defineBrand } from "../defineBrand";

/**
 * Swiss Arabian. Values come from the current site (logo files, metadata,
 * CI / Dockerfile defaults). Per-market names and SEO text still come from the
 * backend (SEO Management → Brand identity); these are the fallbacks.
 */
export const swissArabian = defineBrand({
  code: "SWISS_ARABIAN",
  themeKey: "swiss-arabian",
  defaultLocale: "en",
  name: { en: "Swiss Arabian", ar: "سويس أرابيان" },
  siteName: { en: "Swiss Arabian UAE", ar: "سويس أرابيان الإمارات" },
  hosts: {
    production: [
      "uae.swissarabian.com",
      // Qatar is registered as qa.* but the live site is qatar.* (docs/storefront/URL_REDIRECTS.md).
      "qatar.swissarabian.com",
      "qa.swissarabian.com",
      "www.swissarabian.com",
      "swissarabian.com",
    ],
    staging: [
      "ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
    ],
    local: [],
  },
  logo: {
    src: "/assets/swiss-arabian-online-perfume-store.png",
    footerSrc: "/assets/sa-logo-footer.png",
    alt: {
      en: "Swiss Arabian Online Perfume Store",
      ar: "متجر عطور سويس أرابيان أونلاين",
    },
    width: 428,
    height: 218,
  },
  icons: {
    // TODO(brand): no dedicated favicon files yet; layout uses the backend favicon, else the logo.
    favicon: "/assets/swiss-arabian-online-perfume-store.png",
    appleTouchIcon: "/assets/swiss-arabian-online-perfume-store.png",
    appIcons: [],
  },
  social: {
    instagram: "https://www.instagram.com/swissarabian/",
  },
  legal: {
    privacy: "/pages/privacy-policy",
    terms: "/pages/terms-and-conditions",
    refund: "/pages/refund-policy",
    shipping: "/pages/shipping-delivery-policy",
  },
  seo: {
    defaultTitle: { en: "Swiss Arabian UAE", ar: "سويس أرابيان الإمارات" },
    defaultDescription: {
      en: "Shop Swiss Arabian perfumes, oud, attars and gift sets online.",
      ar: "تسوّق عطور سويس أرابيان والعود ودهن العود وأطقم الهدايا أونلاين.",
    },
  },
  features: {
    storeLocator: true,
    blog: true,
    loyalty: true,
    subscriptions: true,
    giftBox: true,
  },
  ownedIds: {
    // TODO(brand): add the live GTM / GA4 ids once they exist (Key Vault next-public-gtm-id / -ga4-id).
    gtmIds: [],
    ga4Ids: [],
    insiderAccountIds: ["10015366"],
    insiderScriptHosts: ["swissarabianuatnew.api.useinsider.com"],
    // TODO(brand): Tabby merchant code / public key when the merchant account exists.
    tabbyMerchantCodes: [],
    tabbyPublicKeys: [],
    googleMapsMapIds: [],
  },
  requiredInProduction: [
    "NEXT_PUBLIC_STOREFRONT_BRAND_CODE",
    "NEXT_PUBLIC_STOREFRONT_HOST",
    "NEXT_PUBLIC_PRODUCTION_RETURN_URL",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  ],
  integrationDefaults: {
    // Same fallback as src/lib/config/env.ts and the Dockerfile.
    insiderAccountId: "10015366",
    insiderScriptHost: "swissarabianuatnew.api.useinsider.com",
  },
});
