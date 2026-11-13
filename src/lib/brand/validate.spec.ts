import { describe, expect, it } from "vitest";
import { sapil } from "./brands/sapil";
import { swissArabian } from "./brands/swiss-arabian";
import type { BrandConfig, BrandPublicEnv } from "./types";
import { formatBrandCheck, validateBrandEnv } from "./validate";

const swissProduction: BrandPublicEnv = {
  NEXT_PUBLIC_APP_ENV: "production",
  NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SWISS_ARABIAN",
  NEXT_PUBLIC_STOREFRONT_HOST: "uae.swissarabian.com",
  NEXT_PUBLIC_PRODUCTION_RETURN_URL: "https://uae.swissarabian.com",
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "AIzaTestKeyForSpecs123",
  NEXT_PUBLIC_GTM_ID: "GTM-SWISS01",
};

/** Sapil with a production domain and its own ids, as it will look at launch. */
const sapilLive: BrandConfig = {
  ...sapil,
  hosts: { ...sapil.hosts, production: ["shop.sapil.example"] },
  ownedIds: { ...sapil.ownedIds, gtmIds: ["GTM-SAPIL01"] },
};
const swissWithIds: BrandConfig = {
  ...swissArabian,
  ownedIds: { ...swissArabian.ownedIds, gtmIds: ["GTM-SWISS01"], ga4Ids: ["G-SWISS0001"] },
};
const brands = { SWISS_ARABIAN: swissWithIds, SAPIL: sapilLive };

const sapilProduction: BrandPublicEnv = {
  NEXT_PUBLIC_APP_ENV: "production",
  NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SAPIL",
  NEXT_PUBLIC_STOREFRONT_HOST: "shop.sapil.example",
  NEXT_PUBLIC_PRODUCTION_RETURN_URL: "https://shop.sapil.example",
  NEXT_PUBLIC_GTM_ID: "GTM-SAPIL01",
  NEXT_PUBLIC_INSIDER_ENABLED: "false",
};

describe("validateBrandEnv", () => {
  it("passes a complete Swiss Arabian production build", () => {
    const result = validateBrandEnv(swissProduction, brands);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.brandCode).toBe("SWISS_ARABIAN");
  });

  it("passes a complete Sapil production build", () => {
    expect(validateBrandEnv(sapilProduction, brands).errors).toEqual([]);
  });

  it("passes today's local and CI dev builds (no brand code: warning only)", () => {
    const local = validateBrandEnv({
      NEXT_PUBLIC_APP_ENV: "local",
      NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SWISS_ARABIAN",
      NEXT_PUBLIC_STOREFRONT_HOST: "uae.swissarabian.com",
    });
    expect(local.ok).toBe(true);
    const ci = validateBrandEnv({ NEXT_PUBLIC_APP_ENV: "dev" });
    expect(ci.ok).toBe(true);
    expect(ci.brandCode).toBe("SWISS_ARABIAN");
    expect(ci.warnings.join("\n")).toMatch(/BRAND_CODE is not set/);
  });

  it("fails when a required production id is missing", () => {
    const { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: _key, ...rest } = swissProduction;
    const result = validateBrandEnv(rest, brands);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing (required for a production Swiss Arabian (SWISS_ARABIAN) build).",
    );
  });

  it("fails a production build without a brand code", () => {
    const result = validateBrandEnv(
      { ...swissProduction, NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "" },
      brands,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/BRAND_CODE is not set/);
  });

  it("requires Tabby ids when Tabby is switched on", () => {
    const result = validateBrandEnv(
      { ...swissProduction, NEXT_PUBLIC_ENABLE_TABBY: "true" },
      brands,
    );
    expect(result.errors).toContain(
      "NEXT_PUBLIC_TABBY_PUBLIC_KEY is missing (NEXT_PUBLIC_ENABLE_TABBY=true).",
    );
  });

  it("fails an unknown brand code", () => {
    const result = validateBrandEnv({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "ACME" }, brands);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/"ACME" is not a known brand \(known: SWISS_ARABIAN, SAPIL\)/);
  });

  it("fails when Sapil ships Swiss Arabian's analytics id", () => {
    const result = validateBrandEnv(
      { ...sapilProduction, NEXT_PUBLIC_GTM_ID: "GTM-SWISS01" },
      brands,
    );
    expect(result.errors).toContain(
      'NEXT_PUBLIC_GTM_ID="GTM-SWISS01" belongs to Swiss Arabian (SWISS_ARABIAN), not Sapil (SAPIL).',
    );
  });

  it("fails when Sapil sets Swiss Arabian's Insider account", () => {
    const result = validateBrandEnv(
      {
        ...sapilProduction,
        NEXT_PUBLIC_INSIDER_ENABLED: "true",
        NEXT_PUBLIC_INSIDER_ACCOUNT_ID: "10015366",
        NEXT_PUBLIC_INSIDER_SCRIPT_HOST: "sapil.api.useinsider.example",
      },
      brands,
    );
    expect(result.errors.join("\n")).toMatch(
      /NEXT_PUBLIC_INSIDER_ACCOUNT_ID="10015366" belongs to Swiss Arabian/,
    );
  });

  it("passes when Sapil leaves Insider on with no account (no fallback: Insider stays off)", () => {
    const { NEXT_PUBLIC_INSIDER_ENABLED: _off, ...insiderOn } = sapilProduction;
    const result = validateBrandEnv(insiderOn, brands);
    expect(result.errors.join("\n")).not.toMatch(/INSIDER/);
  });

  it("fails when a brand's Insider defaults are another brand's account", () => {
    const { NEXT_PUBLIC_INSIDER_ENABLED: _off, ...insiderOn } = sapilProduction;
    const borrowed: BrandConfig = {
      ...sapilLive,
      integrationDefaults: { insiderAccountId: "10015366" },
    };
    const result = validateBrandEnv(insiderOn, { ...brands, SAPIL: borrowed });
    expect(result.errors.join("\n")).toMatch(
      /NEXT_PUBLIC_INSIDER_ACCOUNT_ID is empty, so the site falls back to "10015366", which belongs to Swiss Arabian/,
    );
  });

  it("fails when the host belongs to another brand", () => {
    const result = validateBrandEnv(
      { ...sapilProduction, NEXT_PUBLIC_STOREFRONT_HOST: "uae.swissarabian.com" },
      brands,
    );
    expect(result.errors).toContain(
      'NEXT_PUBLIC_STOREFRONT_HOST="uae.swissarabian.com" is a Swiss Arabian (SWISS_ARABIAN) host, not Sapil (SAPIL).',
    );
  });

  it("fails when the production host is not one of the brand's production hosts", () => {
    const result = validateBrandEnv(
      { ...swissProduction, NEXT_PUBLIC_STOREFRONT_HOST: "swissarabian.example.net" },
      brands,
    );
    expect(result.errors.join("\n")).toMatch(
      /NEXT_PUBLIC_STOREFRONT_HOST host "swissarabian\.example\.net" is not one of Swiss Arabian \(SWISS_ARABIAN\)'s hosts/,
    );
  });

  it("refuses a production build for a brand with no production hosts yet", () => {
    const result = validateBrandEnv({ ...sapilProduction, NEXT_PUBLIC_STOREFRONT_HOST: "" });
    expect(result.errors.join("\n")).toMatch(/Sapil \(SAPIL\) has no production hosts/);
  });

  it("reports malformed values and hides keys", () => {
    const result = validateBrandEnv(
      {
        ...swissProduction,
        NEXT_PUBLIC_GA4_ID: "UA-1234",
        NEXT_PUBLIC_STOREFRONT_HOST: "https://uae.swissarabian.com",
      },
      brands,
    );
    expect(result.errors.join("\n")).toMatch(/NEXT_PUBLIC_GA4_ID="UA-1234" is not a GA4 measurement id/);
    expect(result.errors.join("\n")).toMatch(/NEXT_PUBLIC_STOREFRONT_HOST=.* is not a hostname/);
    expect(formatBrandCheck(result)).not.toContain("AIzaTestKeyForSpecs123");
  });
});

describe("Insider defaults", () => {
  it("only Swiss Arabian ships a default Insider account; Sapil has none", async () => {
    const { parseBrandIntegrations } = await import("./publicEnv");
    expect(parseBrandIntegrations({}, swissArabian).insider).toEqual({
      enabled: true,
      accountId: "10015366",
      scriptHost: "swissarabianuatnew.api.useinsider.com",
    });
    expect(parseBrandIntegrations({}, sapil).insider).toEqual({
      enabled: false,
      accountId: "",
      scriptHost: "",
    });
  });
});
