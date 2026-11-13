import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/root-params", () => ({ locale: async () => "ar" }));

import { brandDisplayName, brandIntegrations } from "./index";
import { fallbackBrandIdentity } from "@/lib/seo/brandIdentity";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";

afterEach(() => {
  vi.unstubAllEnvs();
});

function deployAs(code: string, extra: Record<string, string> = {}) {
  vi.stubEnv("NEXT_PUBLIC_STOREFRONT_BRAND_CODE", code);
  for (const [key, value] of Object.entries(extra)) vi.stubEnv(key, value);
}

describe("brandIntegrations (getBrand adoption)", () => {
  it("Swiss Arabian keeps its Insider UAT account when the settings are empty", () => {
    deployAs("SWISS_ARABIAN");
    vi.stubEnv("NEXT_PUBLIC_INSIDER_ACCOUNT_ID", undefined);
    vi.stubEnv("NEXT_PUBLIC_INSIDER_SCRIPT_HOST", undefined);
    expect(brandIntegrations().insider).toEqual({
      enabled: true,
      accountId: "10015366",
      scriptHost: "swissarabianuatnew.api.useinsider.com",
    });
  });

  it("Sapil never inherits Swiss Arabian's Insider account", () => {
    deployAs("SAPIL");
    vi.stubEnv("NEXT_PUBLIC_INSIDER_ACCOUNT_ID", undefined);
    expect(brandIntegrations().insider.enabled).toBe(false);
    expect(brandIntegrations().insider.accountId).toBe("");
  });

  it("reads analytics, payment switches, Maps and catalog media from the deployment", () => {
    deployAs("SAPIL", {
      NEXT_PUBLIC_GTM_ID: "GTM-ABC1234",
      NEXT_PUBLIC_ENABLE_PAYMOB: "true",
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "maps-key",
      NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL: "https://media.example.com/",
    });
    const integrations = brandIntegrations();
    expect(integrations.analytics.gtmId).toBe("GTM-ABC1234");
    expect(integrations.payments).toEqual({ paymob: true, tabby: false, tamara: false });
    expect(integrations.googleMaps.apiKey).toBe("maps-key");
    expect(resolveCatalogImageUrl("/catalog/a.jpg")).toBe("https://media.example.com/catalog/a.jpg");
  });
});

describe("brand wording in default metadata", () => {
  it("names the deployment's brand in its language", () => {
    deployAs("SAPIL");
    expect(brandDisplayName("en")).toBe("Sapil");
    deployAs("SWISS_ARABIAN");
    expect(brandDisplayName("ar")).toBe("سويس أرابيان");
  });

  it("fills {brand} in route messages with the deployment's brand", async () => {
    deployAs("SAPIL");
    const { t, brandName } = await routeTranslator();
    expect(brandName).toBe(brandDisplayName("ar"));
    expect(t("pages.blog.description")).toContain(brandName);
    expect(t("pages.blog.description")).not.toContain("سويس");
    // A value the caller passes wins.
    expect(t("pages.blog.description", { brand: "X" })).toContain("X");
  });

  it("falls back to the deployment's own brand identity", () => {
    deployAs("SAPIL");
    const sapil = fallbackBrandIdentity("en");
    expect(sapil.name).toBe("Sapil");
    expect(sapil.description ?? "").not.toMatch(/Swiss Arabian/);
    deployAs("SWISS_ARABIAN");
    expect(fallbackBrandIdentity("en").name).toBe("Swiss Arabian");
  });
});
