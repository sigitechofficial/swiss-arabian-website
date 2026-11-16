// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiBaseUrl,
  appEnv,
  assertRuntimeConfig,
  browserRuntimeConfig,
  runtimeConfigScript,
  seoIndexingEnabled,
} from "./runtime";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment settings read when the server runs (deployment plan W4)", () => {
  it("reads APP_ENV / API_BASE_URL at runtime, never from the build", () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("API_BASE_URL", "https://api.staging.example/");
    expect(appEnv()).toBe("staging");
    expect(apiBaseUrl()).toBe("https://api.staging.example");
    vi.stubEnv("APP_ENV", "production");
    expect(appEnv()).toBe("production");
  });

  it("an unknown or missing environment on a built server is production (the safe side)", () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(appEnv()).toBe("production");
    vi.stubEnv("APP_ENV", "prod");
    expect(appEnv()).toBe("production");
  });

  it("indexes search engines only in production with SEO_INDEXING_ENABLED=true", () => {
    vi.stubEnv("SEO_INDEXING_ENABLED", "true");
    vi.stubEnv("APP_ENV", "staging");
    expect(seoIndexingEnabled()).toBe(false);
    vi.stubEnv("APP_ENV", "production");
    expect(seoIndexingEnabled()).toBe(true);
    vi.stubEnv("SEO_INDEXING_ENABLED", "false");
    expect(seoIndexingEnabled()).toBe(false);
  });

  it("gives the browser only its environment; local conveniences only locally", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("STOREFRONT_HOST", "uae.swissarabian.com");
    vi.stubEnv("API_BASE_URL", "https://internal-backend");
    expect(browserRuntimeConfig()).toEqual({ appEnv: "production", storefrontHost: "", localStorefronts: "" });
    expect(runtimeConfigScript()).not.toContain("internal-backend");
    vi.stubEnv("APP_ENV", "local");
    vi.stubEnv("LOCAL_STOREFRONTS", "sp=SAPIL@sapil.test");
    expect(browserRuntimeConfig()).toEqual({
      appEnv: "local",
      storefrontHost: "uae.swissarabian.com",
      localStorefronts: "sp=SAPIL@sapil.test",
    });
  });

  it("the page script cannot be broken out of", () => {
    const script = runtimeConfigScript({ appEnv: "local", storefrontHost: "</script><b>", localStorefronts: "" });
    expect(script).not.toContain("</script>");
    expect(script.startsWith("window.__SITE_RUNTIME__=")).toBe(true);
  });

  it("refuses to start with missing or wrong settings; never checks a build", () => {
    const ok = { NODE_ENV: "production", APP_ENV: "production", API_BASE_URL: "https://api.example" };
    expect(() => assertRuntimeConfig(ok)).not.toThrow();
    expect(() => assertRuntimeConfig({ ...ok, APP_ENV: undefined })).toThrow(/APP_ENV must be one of/);
    expect(() => assertRuntimeConfig({ ...ok, API_BASE_URL: "" })).toThrow(/API_BASE_URL is required/);
    expect(() => assertRuntimeConfig({ ...ok, API_BASE_URL: "http://api.example" })).toThrow(/must be https/);
    expect(() => assertRuntimeConfig({ ...ok, APP_ENV: "staging", SEO_INDEXING_ENABLED: "true" })).toThrow(
      /production only/,
    );
    expect(() => assertRuntimeConfig({ ...ok, STOREFRONT_HOST: "x.test" })).toThrow(/local-only/);
    expect(() => assertRuntimeConfig({ NEXT_PHASE: "phase-production-build" })).not.toThrow();
  });
});
