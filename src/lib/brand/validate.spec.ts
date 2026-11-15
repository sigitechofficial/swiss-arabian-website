import { describe, expect, it } from "vitest";
import { formatBrandCheck, validateBrandEnv } from "./validate";
import { REMOVED_ENV_KEYS } from "./types";

describe("validateBrandEnv: a brand image's build settings (deployment plan W4)", () => {
  it("passes a build that names a known brand, and nothing else", () => {
    for (const code of ["SWISS_ARABIAN", "SAPIL", "sapil"]) {
      const result = validateBrandEnv({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: code });
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
    }
  });

  it("refuses a build that does not name its brand, or names an unknown one", () => {
    expect(validateBrandEnv({}).errors[0]).toMatch(/is not set: a brand image must name its brand/);
    expect(validateBrandEnv({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "NOPE" }).errors[0]).toMatch(
      /"NOPE" is not a known brand/,
    );
    expect(validateBrandEnv({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "1-bad" }).ok).toBe(false);
  });

  it("refuses every setting it no longer reads, with the reason", () => {
    const raw: Record<string, string> = { NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SWISS_ARABIAN" };
    for (const key of REMOVED_ENV_KEYS) raw[key] = "x";
    const result = validateBrandEnv(raw);
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(REMOVED_ENV_KEYS.length);
    const text = result.errors.join("\n");
    // Environment settings: read when the server runs.
    expect(text).toMatch(/NEXT_PUBLIC_APP_ENV is no longer read: environment settings are read when the server runs/);
    expect(text).toMatch(/NEXT_PUBLIC_PRODUCTION_API_BASE_URL is no longer read: the browser calls its own address/);
    expect(text).toMatch(/NEXT_PUBLIC_STAGING_RETURN_URL is no longer read: payment returns go to the market website/);
    // Integrations: the switchboard.
    expect(text).toMatch(/NEXT_PUBLIC_GTM_ID is no longer read: analytics/);
  });

  it("prints a report naming the brand", () => {
    const report = formatBrandCheck(validateBrandEnv({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SAPIL" }));
    expect(report).toMatch(/^Brand build check: SAPIL/);
    expect(report).toMatch(/OK/);
  });
});
