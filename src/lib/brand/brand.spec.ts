import { describe, expect, it } from "vitest";
import { sapil } from "./brands/sapil";
import { swissArabian } from "./brands/swiss-arabian";
import { defineBrand } from "./defineBrand";
import { localized } from "./index";
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

describe("localized", () => {
  it("falls back from region to language to English", () => {
    expect(localized(swissArabian.name, "ar")).toBe("سويس أرابيان");
    expect(localized(swissArabian.name, "ar-AE")).toBe("سويس أرابيان");
    expect(localized(swissArabian.name, "fr")).toBe("Swiss Arabian");
  });
});
