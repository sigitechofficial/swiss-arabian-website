import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURE_ROUTES } from "@/lib/brand/features";
import { sapil } from "@/lib/brand/brands/sapil";

/**
 * Every view Sapil exports is drawn in Sapil's own design system, except the
 * brand-neutral parts and the views of sections Sapil switched off (their
 * routes answer "not found" before rendering, see src/lib/brand/features.ts).
 */
const SOURCE = readFileSync(path.join(__dirname, "brand-ui.ts"), "utf8");
const CLIENT_SOURCE = readFileSync(path.join(__dirname, "brand-ui.client.ts"), "utf8");

/** Contract names re-exported from outside src/brands/sapil, with why they may be. */
const ALLOWED_SHARED: Record<string, string> = {
  CatalogJsonLd: "a JSON-LD <script>, nothing visible",
  MarketSeoTextSlot: "a path-based slot, renders only its children",
  AccountPlaceholderPageView: "/account/membership (loyalty off)",
  AccountRewardsPageView: "/account/rewards (loyalty off)",
  AccountEmployeeBenefitsPageView: "/account/employee-benefits (employeeBenefits off)",
  AccountSubscriptionDetailPageView: "/account/subscription/[id] (subscriptions off)",
  AccountSubscriptionsPageView: "/account/subscription (subscriptions off)",
  SubscriptionCheckoutPageView: "/subscriptions/[planCode]/checkout (subscriptions off)",
  SubscriptionsPageView: "/subscriptions (subscriptions off)",
};
const OFF_FEATURE_VIEWS: Record<string, keyof typeof FEATURE_ROUTES> = {
  AccountPlaceholderPageView: "loyalty",
  AccountRewardsPageView: "loyalty",
  AccountEmployeeBenefitsPageView: "employeeBenefits",
  AccountSubscriptionDetailPageView: "subscriptions",
  AccountSubscriptionsPageView: "subscriptions",
  SubscriptionCheckoutPageView: "subscriptions",
  SubscriptionsPageView: "subscriptions",
};

function sharedExports(source: string): string[] {
  const names: string[] = [];
  const re = /export\s*\{([^}]*)\}\s*from\s*"(@\/[^"]+)"/g;
  for (const match of source.matchAll(re)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.push(name);
    }
  }
  return names;
}

describe("Sapil brand UI coverage", () => {
  it("re-exports no other brand's visible view", () => {
    expect(SOURCE).not.toMatch(/^export \*/m);
    const shared = sharedExports(SOURCE);
    for (const name of shared) expect(Object.keys(ALLOWED_SHARED), `${name} is not Sapil's`).toContain(name);
  });

  it("only keeps another brand's views for sections Sapil switched off", () => {
    for (const [name, feature] of Object.entries(OFF_FEATURE_VIEWS)) {
      expect(sapil.features[feature], `${name}: ${feature} must stay off while the view is Swiss Arabian's`).toBe(false);
    }
  });

  it("client entry is Sapil's own", () => {
    expect(sharedExports(CLIENT_SOURCE)).toEqual([]);
  });

  it("draws the views fixed in the brand-coverage pass", () => {
    for (const [contract, sapilName] of [
      ["SitePageRoute", "SapilSitePageRoute"],
      ["CmsPreviewHomeView", "SapilCmsPreviewHome"],
      ["ReviewRequestPageView", "SapilReviewRequestPage"],
      ["OfferPageView", "SapilOfferPage"],
      ["PageLoading", "SapilPageLoading"],
      ["FeaturePlaceholder", "SapilFeaturePlaceholder"],
      ["OurStoryFallbackView", "SapilOurStoryFallback"],
      ["FooterSeoText", "SapilFooterSeoText"],
    ]) {
      expect(SOURCE).toMatch(new RegExp(`${sapilName} as ${contract}\\b`));
    }
  });
});
