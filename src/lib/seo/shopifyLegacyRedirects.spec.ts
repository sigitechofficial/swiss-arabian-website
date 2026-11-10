import { describe, expect, it } from "vitest";
import { shopifyLegacyRedirect } from "./shopifyLegacyRedirects";

describe("shopifyLegacyRedirect", () => {
  it.each([
    [
      "/collections/fusion-oud/products/shaghaf-oud-75ml",
      "/products/shaghaf-oud-75ml",
    ],
    ["/collections/all/products/rose-01/", "/products/rose-01"],
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
    ["/uae/return-policy/", "/policies/refund-policy"],
    ["/uae/track-order/", "/track"],
    ["/ksa/pages/faq", "/faq"],
    ["/uae/products/rose-01", "/products/rose-01"],
    ["/ar/uae/return-policy", "/ar/policies/refund-policy"],
  ])("%s → %s", (from, to) => {
    expect(shopifyLegacyRedirect(from)).toBe(to);
  });

  it.each([
    "/products/shaghaf-oud-75ml",
    "/collections/fusion-oud",
    "/account/orders",
    "/pages/some-campaign",
    "/",
    "/ar",
  ])("leaves %s alone", (path) => {
    expect(shopifyLegacyRedirect(path)).toBeNull();
  });
});
