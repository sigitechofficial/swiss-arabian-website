import { afterEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({
  env: {
    appEnv: "dev",
    storefrontHost: "",
    storefrontBrandCode: "",
    localStorefronts: "",
  },
}));

vi.mock("@/lib/config/env", () => mockEnv);

import { getBrand, getBrandConfig } from "@/lib/brand";
import { isSapilStorefront, storefrontLogo } from "./brand";

function setEnv(values: Partial<typeof mockEnv.env>) {
  Object.assign(mockEnv.env, values);
}

afterEach(() => {
  setEnv({ appEnv: "dev", storefrontHost: "", storefrontBrandCode: "", localStorefronts: "" });
});

describe("isSapilStorefront / storefrontLogo per brand", () => {
  it("Swiss Arabian deployment", () => {
    setEnv({ storefrontBrandCode: "SWISS_ARABIAN", storefrontHost: "uae.swissarabian.com" });
    expect(isSapilStorefront("uae.swissarabian.com")).toBe(false);
    expect(storefrontLogo("uae.swissarabian.com")).toEqual({
      src: "/assets/swiss-arabian-online-perfume-store.png",
      alt: "Swiss Arabian Online Perfume Store",
      name: "Swiss Arabian",
      width: 428,
      height: 218,
    });
    expect(getBrand("uae.swissarabian.com").themeKey).toBe("swiss-arabian");
  });

  it("Sapil deployment (by brand code)", () => {
    setEnv({ storefrontBrandCode: "SAPIL", storefrontHost: "sapil-website.vercel.app" });
    expect(isSapilStorefront()).toBe(true);
    expect(storefrontLogo().src).toBe("/assets/sapil-online-perfume-store.png");
    expect(storefrontLogo().alt).toBe("Sapil Online Perfume Store");
    expect(getBrandConfig().code).toBe("SAPIL");
  });

  it("brand code wins over a host that merely contains 'sapil'", () => {
    setEnv({ storefrontBrandCode: "SWISS_ARABIAN" });
    expect(isSapilStorefront("not-sapil.example.com")).toBe(false);
  });

  it("no brand code: a registered Sapil host still means Sapil", () => {
    expect(isSapilStorefront("sapil-website.vercel.app")).toBe(true);
    expect(isSapilStorefront("uae.swissarabian.com")).toBe(false);
    expect(isSapilStorefront()).toBe(false);
  });

  it("local *.localhost aliases pick the brand", () => {
    setEnv({
      appEnv: "local",
      storefrontBrandCode: "SWISS_ARABIAN",
      storefrontHost: "uae.swissarabian.com",
    });
    expect(isSapilStorefront("sp.localhost:3004")).toBe(true);
    expect(storefrontLogo("sp.localhost:3004").name).toBe("Sapil");
    expect(getBrand("sp.localhost:3004").code).toBe("SAPIL");
    expect(isSapilStorefront("sa.localhost:3004")).toBe(false);
    expect(isSapilStorefront("localhost:3004")).toBe(false);
  });
});
