import { describe, expect, it } from "vitest";
import { deploymentInsider } from "./env";

describe("deploymentInsider", () => {
  it("keeps Swiss Arabian's Insider account when the build names no brand", () => {
    expect(deploymentInsider({})).toEqual({
      enabled: true,
      accountId: "10015366",
      scriptHost: "swissarabianuatnew.api.useinsider.com",
    });
  });

  it("never loads Swiss Arabian's Insider on a Sapil build", () => {
    expect(deploymentInsider({ NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SAPIL" })).toMatchObject({
      enabled: false,
      accountId: "",
    });
    expect(deploymentInsider({ NEXT_PUBLIC_STOREFRONT_HOST: "sapil.test" }).accountId).toBe("");
  });

  it("uses the deployment's own ids and honours the off switch", () => {
    const sapil = { NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SAPIL", NEXT_PUBLIC_INSIDER_ACCOUNT_ID: "10099999" };
    expect(deploymentInsider(sapil)).toMatchObject({ enabled: true, accountId: "10099999" });
    expect(deploymentInsider({ ...sapil, NEXT_PUBLIC_INSIDER_ENABLED: "false" }).enabled).toBe(false);
  });
});
