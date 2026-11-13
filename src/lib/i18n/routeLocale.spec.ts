import { beforeEach, describe, expect, it, vi } from "vitest";
import { BRANDS } from "@/lib/brand/registry";

const state = vi.hoisted(() => ({ locale: "en", brand: "SWISS_ARABIAN" }));

vi.mock("next/root-params", () => ({ locale: async () => state.locale }));
vi.mock("@/lib/brand", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/brand")>();
  return { ...actual, getBrandConfig: () => BRANDS[state.brand] };
});

import { routeTranslator } from "./routeLocale";

describe("routeTranslator", () => {
  beforeEach(() => {
    state.locale = "en";
    state.brand = Object.keys(BRANDS).find((code) => code !== "SAPIL")!;
  });

  it("keeps Swiss Arabian's wording on Swiss Arabian builds", async () => {
    const { t } = await routeTranslator();
    expect(t("pages.blog.description")).toBe("Stories, fragrance guides and news from Swiss Arabian.");
  });

  it("names Sapil (never Swiss Arabian) in shared route metadata on Sapil builds", async () => {
    state.brand = "SAPIL";
    const { t } = await routeTranslator();
    for (const key of ["pages.blog.description", "pages.collections.description", "pages.track.description", "pages.faq.description", "pages.stores.description"] as const) {
      expect(t(key)).not.toMatch(/Swiss Arabian|\{brand\}/);
    }
    expect(t("pages.blog.description")).toContain("Sapil");
    state.locale = "ar";
    const ar = (await routeTranslator()).t;
    expect(ar("pages.blog.description")).toContain("سابيل");
    expect(ar("pages.blog.description")).not.toContain("سويس");
  });

  it("lets callers pass their own brand name", async () => {
    const { t } = await routeTranslator();
    expect(t("pages.home.title", { brand: "X" })).toMatch(/^X/);
  });
});
