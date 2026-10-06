import { describe, expect, it } from "vitest";
import {
  collectionCopyFromMetafields,
  metafieldMediaUrl,
  pickCollectionBanners,
} from "./collectionMetafields";

describe("collectionMetafields", () => {
  it("parses JSON banner blobs", () => {
    expect(
      metafieldMediaUrl(
        JSON.stringify({ url: "https://cdn.example/banner.jpg", name: "file.jpg" }),
      ),
    ).toBe("https://cdn.example/banner.jpg");
  });

  it("ignores Shopify media GIDs until they are real URLs", () => {
    expect(
      metafieldMediaUrl("gid://shopify/MediaImage/45021219291447"),
    ).toBeNull();
  });

  it("prefers Arabic banners when language is ar", () => {
    const picked = pickCollectionBanners(
      {
        collection_banner: "https://cdn.example/en.jpg",
        collection_banner_arabic: "https://cdn.example/ar.jpg",
      },
      "ar-AE",
    );
    expect(picked.desktop).toBe("https://cdn.example/ar.jpg");
  });

  it("falls back to EN when Arabic is missing", () => {
    const picked = pickCollectionBanners(
      { collection_banner: "https://cdn.example/en.jpg" },
      "ar",
    );
    expect(picked.desktop).toBe("https://cdn.example/en.jpg");
  });

  it("reads merch copy without inventing it", () => {
    expect(collectionCopyFromMetafields({})).toEqual({
      title: null,
      intro: null,
    });
    expect(
      collectionCopyFromMetafields({
        collection_name: "New Launches",
        seo_content: "Just landed.",
      }),
    ).toEqual({ title: "New Launches", intro: "Just landed." });
  });
});
