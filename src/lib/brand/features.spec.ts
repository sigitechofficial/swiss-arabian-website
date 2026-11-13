import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// The route files only need view names; the gate runs before any view renders.
vi.mock("@brand-ui", () => {
  const view = () => null;
  return {
    AccountEmployeeBenefitsPageView: view,
    AccountPlaceholderPageView: view,
    AccountRewardsPageView: view,
    AccountSubscriptionDetailPageView: view,
    AccountSubscriptionsPageView: view,
    CatalogJsonLd: view,
    FeaturePlaceholder: view,
    SitePageView: view,
    SubscriptionCheckoutPageView: view,
    SubscriptionsPageView: view,
  };
});

import { sapil } from "./brands/sapil";
import { swissArabian } from "./brands/swiss-arabian";
import {
  FEATURE_ROUTES,
  brandFeatureEnabled,
  brandFeatures,
  brandLinkEnabled,
  featureForPath,
  type BrandFeature,
} from "./features";
import { requireBrandFeature } from "./featureGate";
import { withoutDisabledSections } from "@/features/navigation/utils/brandSections";
import type { NavItem } from "@/features/navigation/types/navigation";

const ALL: BrandFeature[] = ["storeLocator", "blog", "loyalty", "subscriptions", "giftBox", "employeeBenefits"];
const ORIGINAL_CODE = process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;

afterEach(() => {
  if (ORIGINAL_CODE === undefined) delete process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;
  else process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = ORIGINAL_CODE;
});

describe("brand features", () => {
  it("Swiss Arabian keeps every section on", () => {
    for (const feature of ALL) expect(swissArabian.features[feature]).toBe(true);
  });

  it("Sapil launches with the Journal only", () => {
    expect(sapil.features).toEqual({
      storeLocator: false,
      blog: true,
      loyalty: false,
      subscriptions: false,
      giftBox: false,
      employeeBenefits: false,
    });
  });

  it("every feature owns at least one route", () => {
    for (const feature of ALL) expect(FEATURE_ROUTES[feature].length).toBeGreaterThan(0);
  });

  it("maps paths (any language prefix, query or sub-path) to their feature", () => {
    expect(featureForPath("/stores")).toBe("storeLocator");
    expect(featureForPath("/ar/stores?x=1")).toBe("storeLocator");
    expect(featureForPath("/blog/a-post")).toBe("blog");
    expect(featureForPath("/account/rewards")).toBe("loyalty");
    expect(featureForPath("/account/membership")).toBe("loyalty");
    expect(featureForPath("/subscriptions/PLAN/checkout")).toBe("subscriptions");
    expect(featureForPath("/account/subscription/abc")).toBe("subscriptions");
    expect(featureForPath("/gift-box")).toBe("giftBox");
    expect(featureForPath("/account/employee-benefits")).toBe("employeeBenefits");
    // Neighbours and externals are not owned.
    expect(featureForPath("/storesxyz")).toBeNull();
    expect(featureForPath("/account/orders")).toBeNull();
    expect(featureForPath("/products/blog-perfume")).toBeNull();
    expect(featureForPath("https://example.com/stores")).toBeNull();
    expect(featureForPath("//cdn.example.com/blog")).toBeNull();
  });

  it("brandLinkEnabled hides only switched-off sections", () => {
    expect(brandLinkEnabled("/stores", sapil.features)).toBe(false);
    expect(brandLinkEnabled("/account/rewards", sapil.features)).toBe(false);
    expect(brandLinkEnabled("/blog", sapil.features)).toBe(true);
    expect(brandLinkEnabled("/products", sapil.features)).toBe(true);
    for (const routes of Object.values(FEATURE_ROUTES)) {
      for (const route of routes) expect(brandLinkEnabled(route, swissArabian.features)).toBe(true);
    }
  });

  it("follows the deployment's brand code", () => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SAPIL";
    expect(brandFeatures()).toEqual(sapil.features);
    expect(brandFeatureEnabled("subscriptions")).toBe(false);
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SWISS_ARABIAN";
    expect(brandFeatureEnabled("subscriptions")).toBe(true);
    delete process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;
    expect(brandFeatures()).toEqual(swissArabian.features);
  });

  it("requireBrandFeature answers not found for a switched-off section", () => {
    expect(() => requireBrandFeature("storeLocator", sapil.features)).toThrow("NEXT_NOT_FOUND");
    expect(() => requireBrandFeature("blog", sapil.features)).not.toThrow();
    for (const feature of ALL) {
      expect(() => requireBrandFeature(feature, swissArabian.features)).not.toThrow();
    }
  });

  it("drops menu links into switched-off sections (and groups left empty)", () => {
    const item = (id: string, href: string | null, children?: NavItem[]): NavItem => ({
      id,
      label: id,
      slug: null,
      type: "URL",
      href,
      children,
    });
    const menu = [
      item("shop", "/products"),
      item("stores", "/stores"),
      item("help", null, [item("faq", "/faq"), item("rewards", "/account/rewards")]),
      item("club", null, [item("plans", "/subscriptions")]),
    ];
    expect(withoutDisabledSections(menu, sapil.features).map((i) => [i.id, i.children?.map((c) => c.id)])).toEqual([
      ["shop", undefined],
      ["help", ["faq"]],
    ]);
    expect(withoutDisabledSections(menu, swissArabian.features)).toEqual(menu);
  });
});

describe("gated routes", () => {
  const ROUTES: Array<[string, () => Promise<{ default: (props: never) => unknown }>]> = [
    ["/gift-box", () => import("@/app/[locale]/(shop)/gift-box/page")],
    ["/account/rewards", () => import("@/app/[locale]/(account)/account/rewards/page")],
    ["/account/membership", () => import("@/app/[locale]/(account)/account/membership/page")],
    ["/account/employee-benefits", () => import("@/app/[locale]/(account)/account/employee-benefits/page")],
    ["/account/subscription", () => import("@/app/[locale]/(account)/account/subscription/page")],
    ["/account/subscription/[id]", () => import("@/app/[locale]/(account)/account/subscription/[id]/page")],
    ["/subscriptions", () => import("@/app/[locale]/(shop)/subscriptions/page")],
    ["/subscriptions/[planCode]", () => import("@/app/[locale]/(shop)/subscriptions/[planCode]/page")],
    [
      "/subscriptions/[planCode]/checkout",
      () => import("@/app/[locale]/(checkout)/subscriptions/[planCode]/checkout/page"),
    ],
    ["/stores", () => import("@/app/[locale]/(shop)/stores/page")],
  ];

  it.each(ROUTES)("%s answers not found on Sapil", async (_path, load) => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SAPIL";
    const page = (await load()).default;
    const props = { params: Promise.resolve({ id: "x", planCode: "x" }) } as never;
    await expect(Promise.resolve().then(() => page(props))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("Swiss Arabian still renders the rewards page", async () => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SWISS_ARABIAN";
    const page = (await import("@/app/[locale]/(account)/account/rewards/page")).default;
    expect(() => page()).not.toThrow();
  });
});
