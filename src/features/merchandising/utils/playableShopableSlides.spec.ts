import { describe, expect, it } from "vitest";
import type { ShopableVideoView } from "../types/merch";
import {
  parseShopablePrice,
  playableShopableSlides,
} from "./playableShopableSlides";

function view(
  partial: Partial<ShopableVideoView> & Pick<ShopableVideoView, "available" | "slides">,
): ShopableVideoView {
  return {
    context: {
      zoneId: null,
      zoneCode: "UAE",
      salesChannelCode: "platform_uae",
      languageCode: "en",
      currencyCode: "AED",
      legalEntityCode: null,
    },
    sectionTitle: "Watch & Shop!",
    collection: null,
    ...partial,
  };
}

describe("playableShopableSlides", () => {
  it("hides when available is false", () => {
    expect(
      playableShopableSlides(
        view({
          available: false,
          slides: [
            {
              productId: "1",
              variantId: null,
              sku: "A",
              slug: "rose",
              name: "Rose",
              image: null,
              video: { url: "https://cdn.example/pr.mp4", name: "pr.mp4" },
              priceSummary: { price: "199", currencyCode: "AED", hasValidPrice: true },
              isSellable: true,
              isVisible: true,
              sortOrder: 0,
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("drops slides without https video and sorts by sortOrder", () => {
    const slides = playableShopableSlides(
      view({
        available: true,
        slides: [
          {
            productId: "2",
            variantId: "v2",
            sku: "B",
            slug: "oud",
            name: "Oud",
            image: null,
            video: { url: "https://cdn.example/b.mp4", name: "b.mp4" },
            priceSummary: null,
            isSellable: true,
            isVisible: true,
            sortOrder: 2,
          },
          {
            productId: "1",
            variantId: "v1",
            sku: "A",
            slug: "rose",
            name: "Rose",
            image: null,
            video: { url: "http://cdn.example/a.mp4", name: "a.mp4" },
            priceSummary: null,
            isSellable: true,
            isVisible: true,
            sortOrder: 0,
          },
          {
            productId: "3",
            variantId: "v3",
            sku: "C",
            slug: "vanilla",
            name: "Vanilla",
            image: null,
            video: { url: "https://cdn.example/c.mp4", name: "c.mp4" },
            priceSummary: null,
            isSellable: true,
            isVisible: true,
            sortOrder: 1,
          },
        ],
      }),
    );
    expect(slides.map((s) => s.productId)).toEqual(["3", "2"]);
  });
});

describe("parseShopablePrice", () => {
  it("parses decimal string prices", () => {
    expect(
      parseShopablePrice({
        priceSummary: { price: "199", currencyCode: "AED", hasValidPrice: true },
      }),
    ).toEqual({ price: 199, currency: "AED" });
  });
});
