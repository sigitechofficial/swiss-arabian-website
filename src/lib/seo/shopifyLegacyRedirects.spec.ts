import { describe, expect, it } from "vitest";
import { shopifyLegacyRedirect } from "./shopifyLegacyRedirects";

describe("shopifyLegacyRedirect", () => {
  it.each([
    [
      "/collections/fusion-oud/products/shaghaf-oud-75ml",
      "/products/shaghaf-oud-75ml",
    ],
    ["/collections/all/products/rose-01/", "/products/rose-01"],
    ["/collections/all", "/products"],
    ["/policies/shipping-policy", "/pages/shipping-delivery-policy"],
    ["/policies/refund-policy", "/pages/refund-policy"],
    ["/ar/policies/privacy-policy", "/ar/pages/privacy-policy"],
    ["/policies/terms-of-service", "/pages/terms-and-conditions"],
    ["/refund-policy", "/pages/refund-policy"],
    ["/return-policy", "/pages/refund-policy"],
    ["/privacy-policy", "/pages/privacy-policy"],
    ["/ar/collections/all/", "/ar/products"],
    ["/pages/wishlist", "/account/wishlist"],
    ["/pages/rapid-search-results", "/search"],
    ["/pages/order-status", "/track"],
    ["/ar/pages/blogs", "/ar/blog"],
    ["/pages/product-feed", "/pages/download-product-catalogue"],
    ["/pages/collection-bundle", "/collections/bundles"],
    ["/account/login", "/login"],
    ["/account/register", "/register"],
    ["/account/reset/123/abc", "/forgot-password"],
    ["/account/orders/9f8e7d", "/account/orders"],
    ["/pages/about-us", "/our-story"],
    ["/pages/our-story-1", "/our-story"],
    ["/pages/FAQ", "/faq"],
    ["/blogs/news/how-to-layer-oud", "/blog/how-to-layer-oud"],
    ["/blogs/news", "/blog"],
    [
      "/ar/collections/fusion-oud/products/shaghaf-oud-75ml",
      "/ar/products/shaghaf-oud-75ml",
    ],
    ["/ar/account/login", "/ar/login"],
    ["/uae/return-policy/", "/pages/refund-policy"],
    ["/uae/track-order/", "/track"],
    ["/ksa/pages/faq", "/faq"],
    ["/uae/products/rose-01", "/products/rose-01"],
    ["/ar/uae/return-policy", "/ar/pages/refund-policy"],
  ])("%s → %s", (from, to) => {
    expect(shopifyLegacyRedirect(from)).toBe(to);
  });

  it.each([
    "/products/shaghaf-oud-75ml",
    "/collections/fusion-oud",
    "/account/orders",
    "/account/orders/de5d6160-ef0d-4382-ad56-d31e81004aea",
    "/pages/some-campaign",
    "/policies/contact-information",
    "/",
    "/ar",
  ])("leaves %s alone", (path) => {
    expect(shopifyLegacyRedirect(path)).toBeNull();
  });
});
