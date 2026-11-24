import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: { apiBaseUrl: "http://api.test", tracking: { engagementSeconds: 10 } },
}));
vi.mock("@/lib/auth/token", () => ({ getAccessToken: () => null }));
vi.mock("@/lib/api/storefrontHost", () => ({ resolveStorefrontHost: async () => "sa.test" }));
vi.mock("@/lib/storefront/context", () => ({ storefrontContextQuery: () => "" }));

import { resetConsentCacheForTests } from "@/lib/consent/consent";
import {
  pageTypeForPath,
  resetRecommendationEventsForTests,
  trackRecommendationClicked,
  trackRecommendationImpression,
  trackSearchResultClicked,
  trackSearchResultsViewed,
  trackWebVital,
} from "./siteEvents";
import {
  queuedEventsForTests,
  resetTrackerForTests,
  setFirstPartyTracking,
  setTrackingConsent,
} from "./tracker";
import { productSlugFromHref, recommendationIndexForClick } from "./useRecommendationTracking";

beforeEach(() => {
  resetTrackerForTests();
  resetRecommendationEventsForTests();
  localStorage.clear();
  sessionStorage.clear();
  resetConsentCacheForTests();
  setFirstPartyTracking(true);
  setTrackingConsent("granted");
});

describe("pageTypeForPath (Shopify web performance page types)", () => {
  it("names the store's page types", () => {
    expect(pageTypeForPath("/")).toBe("Index");
    expect(pageTypeForPath("/products/rose-01")).toBe("Product");
    expect(pageTypeForPath("/products")).toBe("Collection");
    expect(pageTypeForPath("/products/p/2")).toBe("Collection");
    expect(pageTypeForPath("/collections/oud")).toBe("Collection");
    expect(pageTypeForPath("/collections")).toBe("List collections");
    expect(pageTypeForPath("/cart")).toBe("Cart");
    expect(pageTypeForPath("/search")).toBe("Search");
    expect(pageTypeForPath("/blog")).toBe("Blog");
    expect(pageTypeForPath("/blog/how-to-layer")).toBe("Article");
    expect(pageTypeForPath("/pages/about")).toBe("Page");
    expect(pageTypeForPath("/checkout")).toBe("Checkout");
    expect(pageTypeForPath("/account/orders")).toBe("Account");
    expect(pageTypeForPath("/login")).toBe("Other");
  });
});

describe("trackWebVital", () => {
  it("records LCP, INP and CLS with the page type of the page that was loaded", () => {
    trackWebVital({ id: "v1", name: "LCP", value: 2533.6, rating: "needs-improvement" }, "/products/rose-01");
    trackWebVital({ id: "v2", name: "CLS", value: 0.123456 }, "/");
    trackWebVital({ id: "v3", name: "TTFB", value: 120 }, "/");
    const events = queuedEventsForTests();
    expect(events.map((e) => e.eventName)).toEqual(["web_vital_recorded", "web_vital_recorded"]);
    expect(events[0].properties).toMatchObject({
      metric: "LCP",
      value: 2534,
      rating: "needs-improvement",
      pageType: "Product",
      pagePath: "/products/rose-01",
    });
    expect(events[1].properties).toMatchObject({ metric: "CLS", value: 0.1235, pageType: "Index" });
  });

  it("records each metric of a page load once (Next can report it again)", () => {
    trackWebVital({ id: "v9", name: "INP", value: 120 }, "/cart");
    trackWebVital({ id: "v9", name: "INP", value: 120 }, "/cart");
    trackWebVital({ id: "v10", name: "INP", value: 120 }, "/cart");
    expect(queuedEventsForTests()).toHaveLength(1);
  });

  it("sends nothing without analytics consent", () => {
    setTrackingConsent("denied");
    trackWebVital({ id: "v1", name: "LCP", value: 2000 }, "/");
    expect(queuedEventsForTests()).toHaveLength(0);
  });
});

describe("recommendation events", () => {
  it("records shown and clicked products with their section and position", () => {
    const product = { id: "p1", variantId: "v1", sku: "SKU1", slug: "rose-01" };
    trackRecommendationImpression("pdp_also_like", product, 2);
    trackRecommendationClicked("pdp_also_like", product, 2);
    const [shown, clicked] = queuedEventsForTests();
    expect(shown.eventName).toBe("product_recommendation_impression");
    expect(clicked.eventName).toBe("product_recommendation_clicked");
    expect(clicked.properties).toMatchObject({
      productId: "p1",
      variantId: "v1",
      sku: "SKU1",
      surface: "pdp_also_like",
      position: 2,
    });
  });

  it("a section that renders again does not show its products again on the same page", () => {
    const product = { id: "p1", slug: "rose-01" };
    trackRecommendationImpression("pdp_also_like", product, 1);
    trackRecommendationImpression("pdp_also_like", product, 3);
    trackRecommendationImpression("cart_drawer", product, 1);
    expect(queuedEventsForTests().map((e) => e.properties.surface)).toEqual(["pdp_also_like", "cart_drawer"]);
  });

  it("finds the clicked product from a marked item or the card's product link", () => {
    const root = document.createElement("section");
    root.innerHTML = `
      <ul>
        <li><a href="/en/products/rose-01">Rose</a><button id="add1">Add</button></li>
        <li><a href="/en/products/oud-02?x=1">Oud</a><button id="add2">Add</button></li>
      </ul>
      <article data-rec-index="2"><button id="add3">Add</button></article>`;
    document.body.appendChild(root);
    const products = [{ slug: "rose-01" }, { slug: "oud-02" }, { slug: "amber-03" }];
    const at = (selector: string) => root.querySelector(selector) as Element;
    expect(recommendationIndexForClick(at("#add1"), root, products)).toBe(0);
    expect(recommendationIndexForClick(at("a[href*='oud']"), root, products)).toBe(1);
    expect(recommendationIndexForClick(at("#add3"), root, products)).toBe(2);
    // A click on the list itself (several products) is not a product click.
    expect(recommendationIndexForClick(at("ul"), root, products)).toBe(-1);
    root.remove();
  });

  it("reads the slug from localized product links", () => {
    expect(productSlugFromHref("/ar/products/%D8%B9%D9%88%D8%AF")).toBe("عود");
    expect(productSlugFromHref("/products/rose-01#reviews")).toBe("rose-01");
    expect(productSlugFromHref("/collections/oud")).toBeNull();
  });
});

describe("search events", () => {
  it("records a search with its words and result count, and clicks on its results with the same id", () => {
    trackSearchResultsViewed("q1", "oud royal", 12);
    trackSearchResultClicked("q1", { id: "p1", variantId: "v1", sku: "SKU1", slug: "oud-royal" }, 3);
    const [search, click] = queuedEventsForTests();
    expect(search.eventName).toBe("search_results_viewed");
    expect(search.properties).toMatchObject({ searchId: "q1", searchTerm: "oud royal", resultCount: 12 });
    expect(click.eventName).toBe("search_result_clicked");
    expect(click.properties).toMatchObject({ searchId: "q1", productId: "p1", variantId: "v1", sku: "SKU1", position: 3 });
  });
});
