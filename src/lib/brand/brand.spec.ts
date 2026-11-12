import { describe, expect, it } from "vitest";
import { sapil } from "./brands/sapil";
import { swissArabian } from "./brands/swiss-arabian";
import { defineBrand } from "./defineBrand";
import { localized } from "./index";
import { parseBrandIntegrations } from "./publicEnv";
import {
  BRANDS,
  DEFAULT_BRAND_CODE,
  brandForCode,
  brandOwningHost,
  resolveBrand,
} from "./registry";
import { brandConfigSchema, type BrandConfig } from "./types";

describe("brand config schema", () => {
  it.each(Object.values(BRANDS))("$code passes the schema", (brand) => {
    expect(brandConfigSchema.safeParse(brand).success).toBe(true);
  });

  it("keeps hosts unique across brands", () => {
    const all = Object.values(BRANDS).flatMap((brand) => [
      ...brand.hosts.production,
      ...brand.hosts.staging,
      ...brand.hosts.local,
    ]);
    expect(new Set(all).size).toBe(all.length);
  });

  it("accepts a third brand with any code and extra locales", () => {
    const third: BrandConfig = {
      ...sapil,
      code: "ACME_PERFUMES",
      name: { en: "Acme", ar: "أكمي", fr: "Acmé" },
    };
    expect(defineBrand(third).code).toBe("ACME_PERFUMES");
  });

  it("rejects a bad code, a host with a scheme, a relative logo and a name without en", () => {
    const bad = {
      ...sapil,
      code: "sapil",
      name: { ar: "سابيل" },
      hosts: { ...sapil.hosts, staging: ["https://sapil.example.com"] },
      logo: { ...sapil.logo, src: "assets/logo.png" },
    } as unknown as BrandConfig;
    expect(() => defineBrand(bad)).toThrowError(
      /code: brand code must be UPPER_SNAKE_CASE[\s\S]*name: needs an `en` entry[\s\S]*hosts\.staging\.0[\s\S]*logo\.src/,
    );
  });
});

describe("brand registry", () => {
  it("finds brands by code, case-insensitively", () => {
    expect(brandForCode("SWISS_ARABIAN")).toBe(swissArabian);
    expect(brandForCode(" sapil ")).toBe(sapil);
    expect(brandForCode("NOPE")).toBeNull();
    expect(brandForCode("")).toBeNull();
    expect(brandForCode("toString")).toBeNull();
  });

  it("finds the brand that owns a host", () => {
    expect(brandOwningHost("https://uae.swissarabian.com/ar")).toBe(swissArabian);
    expect(brandOwningHost("sapil.test:3004")).toBe(sapil);
    expect(brandOwningHost("sapil-website.vercel.app")).toBe(sapil);
    expect(brandOwningHost("example.com")).toBeNull();
  });

  it("resolves code first, then host, then the default brand", () => {
    expect(resolveBrand({ brandCode: "SAPIL", host: "uae.swissarabian.com" })).toBe(sapil);
    expect(resolveBrand({ brandCode: "", host: "sapil.test" })).toBe(sapil);
    expect(resolveBrand({ brandCode: "UNKNOWN", host: "unknown.example" }).code).toBe(
      DEFAULT_BRAND_CODE,
    );
    expect(DEFAULT_BRAND_CODE).toBe("SWISS_ARABIAN");
  });
});

describe("brand integrations", () => {
  it("groups and validates the public ids", () => {
    const integrations = parseBrandIntegrations(
      {
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_GTM_ID: "gtm-abc1234",
        NEXT_PUBLIC_GA4_ID: "not-an-id",
        NEXT_PUBLIC_ENABLE_TABBY: "true",
        NEXT_PUBLIC_STOREFRONT_HOST: "UAE.swissarabian.com",
        NEXT_PUBLIC_PRODUCTION_RETURN_URL: "https://uae.swissarabian.com/",
        NEXT_PUBLIC_SEO_INDEXING_ENABLED: "true",
      },
      swissArabian,
    );
    expect(integrations.analytics).toEqual({ gtmId: "GTM-ABC1234", ga4Id: null });
    expect(integrations.payments).toEqual({ paymob: false, tabby: true, tamara: false });
    expect(integrations.storefrontHost).toBe("uae.swissarabian.com");
    expect(integrations.returnUrls.production).toBe("https://uae.swissarabian.com");
    expect(integrations.seoIndexingEnabled).toBe(true);
  });

  it("uses Swiss Arabian's Insider fallback but none for Sapil", () => {
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

describe("localized", () => {
  it("falls back from region to language to English", () => {
    expect(localized(swissArabian.name, "ar")).toBe("سويس أرابيان");
    expect(localized(swissArabian.name, "ar-AE")).toBe("سويس أرابيان");
    expect(localized(swissArabian.name, "fr")).toBe("Swiss Arabian");
  });
});
