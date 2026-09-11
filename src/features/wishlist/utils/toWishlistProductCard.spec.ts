import { describe, expect, it } from "vitest";
import type { StorefrontWishlistProductSummaryView } from "../types/wishlist";
import { toWishlistProductCard, wishlistPrice } from "./toWishlistProductCard";

const UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

function summary(
  overrides: Partial<StorefrontWishlistProductSummaryView> = {},
): StorefrontWishlistProductSummaryView {
  return {
    productId: UUID,
    slug: "oud-01",
    name: "Oud",
    image: "/catalog/media/files/uae/x.webp",
    currency: "AED",
    priceSummary: { price: "250.00", currencyCode: "AED", hasValidPrice: true },
    isVisible: true,
    isSellable: true,
    sellabilityStatus: null,
    variantId: "variant-1",
    sku: "SKU-1",
    ...overrides,
  };
}

describe("toWishlistProductCard", () => {
  it("maps sellable product for PLP card + ATC", () => {
    const card = toWishlistProductCard(summary());
    expect(card).toMatchObject({
      id: UUID,
      slug: "oud-01",
      sku: "SKU-1",
      variantId: "variant-1",
      price: 250,
      currency: "AED",
    });
  });

  it("returns null without slug (cannot link to PDP)", () => {
    expect(toWishlistProductCard(summary({ slug: null }))).toBeNull();
  });

  it("treats missing price as not addable", () => {
    expect(
      wishlistPrice(
        summary({
          priceSummary: { hasValidPrice: false },
        }),
      ).price,
    ).toBeNull();
  });
});
