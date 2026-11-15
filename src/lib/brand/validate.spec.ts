import { describe, expect, it } from "vitest";
import { sapil } from "./brands/sapil";
import { swissArabian } from "./brands/swiss-arabian";
import { REMOVED_ENV_KEYS, type BrandConfig, type BrandPublicEnv } from "./types";
import { formatBrandCheck, validateBrandEnv } from "./validate";

const swissProduction: BrandPublicEnv = {
  NEXT_PUBLIC_APP_ENV: "production",
  NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SWISS_ARABIAN",
  NEXT_PUBLIC_STOREFRONT_HOST: "uae.swissarabian.com",
  NEXT_PUBLIC_PRODUCTION_RETURN_URL: "https://uae.swissarabian.com",
};

/** Sapil with a production domain, as it will look at launch. */
const sapilLive: BrandConfig = {
  ...sapil,
  hosts: { ...sapil.hosts, production: ["shop.sapil.example"] },
};
const brands = { SWISS_ARABIAN: swissArabian, SAPIL: sapilLive };

const sapilProduction: BrandPublicEnv = {
  NEXT_PUBLIC_APP_ENV: "production",
  NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SAPIL",
  NEXT_PUBLIC_STOREFRONT_HOST: "shop.sapil.example",
  NEXT_PUBLIC_PRODUCTION_RETURN_URL: "https://shop.sapil.example",
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

  it("fails when a required production setting is missing", () => {
    const { NEXT_PUBLIC_PRODUCTION_RETURN_URL: _url, ...rest } = swissProduction;
    const result = validateBrandEnv(rest, brands);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "NEXT_PUBLIC_PRODUCTION_RETURN_URL is missing (required for a production Swiss Arabian (SWISS_ARABIAN) build).",
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

  it("refuses settings that moved to the integrations switchboard, in every environment, without printing them", () => {
    for (const appEnv of ["local", "production"]) {
      const result = validateBrandEnv(
        {
          ...swissProduction,
          NEXT_PUBLIC_APP_ENV: appEnv,
          NEXT_PUBLIC_GTM_ID: "GTM-SWISS01",
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "AIzaTestKeyForSpecs123",
          NEXT_PUBLIC_INSIDER_ACCOUNT_ID: "10015366",
        },
        brands,
      );
      expect(result.ok).toBe(false);
      expect(result.errors.join("\n")).toMatch(
        /NEXT_PUBLIC_GTM_ID is no longer read: .* set per market in the admin \(Settings → Integrations\)/,
      );
      expect(result.errors.join("\n")).toMatch(/NEXT_PUBLIC_INSIDER_ACCOUNT_ID is no longer read/);
      expect(formatBrandCheck(result)).not.toContain("AIzaTestKeyForSpecs123");
    }
  });

  it("lists every moved setting (analytics, Insider, Tabby / Tamara / Paymob switches, Maps)", () => {
    expect([...REMOVED_ENV_KEYS].sort()).toEqual(
      [
        "NEXT_PUBLIC_ENABLE_PAYMOB",
        "NEXT_PUBLIC_ENABLE_TABBY",
        "NEXT_PUBLIC_ENABLE_TAMARA",
        "NEXT_PUBLIC_GA4_ID",
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
        "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID",
        "NEXT_PUBLIC_GTM_ID",
        "NEXT_PUBLIC_INSIDER_ACCOUNT_ID",
        "NEXT_PUBLIC_INSIDER_ENABLED",
        "NEXT_PUBLIC_INSIDER_SCRIPT_HOST",
        "NEXT_PUBLIC_TABBY_MERCHANT_CODE",
        "NEXT_PUBLIC_TABBY_PUBLIC_KEY",
      ].sort(),
    );
  });

  it("fails an unknown brand code", () => {
    const result = validateBrandEnv({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "ACME" }, brands);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/"ACME" is not a known brand \(known: SWISS_ARABIAN, SAPIL\)/);
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

  it("reports malformed values", () => {
    const result = validateBrandEnv(
      { ...swissProduction, NEXT_PUBLIC_STOREFRONT_HOST: "https://uae.swissarabian.com" },
      brands,
    );
    expect(result.errors.join("\n")).toMatch(/NEXT_PUBLIC_STOREFRONT_HOST=.* is not a hostname/);
  });
});
