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
  it("reads catalog media from the deployment", () => {
    deployAs("SAPIL", {
      NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL: "https://media.example.com/",
    });
    expect(brandIntegrations().catalogMediaBaseUrl).toBe("https://media.example.com");
    expect(resolveCatalogImageUrl("/catalog/a.jpg")).toBe("https://media.example.com/catalog/a.jpg");
  });

  it("carries no analytics, Insider, Tabby or Maps ids: those come per address from the backend (ADR-005 phase E)", () => {
    deployAs("SWISS_ARABIAN", { NEXT_PUBLIC_GTM_ID: "GTM-ABC1234" });
    const integrations = brandIntegrations() as Record<string, unknown>;
    for (const key of ["analytics", "insider", "tabby", "googleMaps", "payments"]) {
      expect(integrations[key]).toBeUndefined();
    }
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
