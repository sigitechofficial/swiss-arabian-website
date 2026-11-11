import { describe, expect, it } from "vitest";
import { buildCatalogMetadata } from "./catalogPage";
import { isAllowedShareSource, shareImageFor } from "./shareImage";

const BLOB =
  "https://stswissarabiandev.blob.core.windows.net/catalog-images/products/x/1.webp";

describe("share images (link previews)", () => {
  it("only our own image hosts and /assets files are converted", () => {
    expect(isAllowedShareSource(BLOB)).toBe(true);
    expect(
      isAllowedShareSource("/assets/swiss-arabian-online-perfume-store.png"),
    ).toBe(true);
    expect(isAllowedShareSource("https://evil.example.com/a.jpg")).toBe(false);
    expect(isAllowedShareSource("/api/share-image?src=x")).toBe(false);
    expect(isAllowedShareSource("http://169.254.169.254/latest")).toBe(false);
  });

  it("gives a JPEG with its exact size: square for products, wide otherwise", () => {
    expect(shareImageFor(BLOB, "square", "ZAHRA")).toEqual({
      url: `/api/share-image?src=${encodeURIComponent(BLOB)}&shape=square`,
      width: 1200,
      height: 1200,
      type: "image/jpeg",
      alt: "ZAHRA",
    });
    expect(shareImageFor(BLOB, "wide", "x")).toMatchObject({
      width: 1200,
      height: 630,
    });
  });

  it("pages without their own image use the market share image, then the logo", () => {
    const brand = { name: "Swiss Arabian UAE", names: ["Swiss Arabian UAE"] };
    const page = {
      locale: "en" as const,
      path: "/pages/privacy-policy",
      title: "Privacy",
    };
    const withShare = buildCatalogMetadata(page, {
      brand: { ...brand, shareImage: BLOB },
    });
    const og = withShare.openGraph as {
      images: Array<{ url: string; width: number }>;
    };
    expect(og.images[0].url).toContain(encodeURIComponent(BLOB));
    expect(og.images[0].width).toBe(1200);

    const logoOnly = buildCatalogMetadata(page, { brand });
    const ogLogo = logoOnly.openGraph as { images: Array<{ url: string }> };
    expect(ogLogo.images[0].url).toContain(encodeURIComponent("/assets/"));
    expect((logoOnly.twitter as { card: string }).card).toBe(
      "summary_large_image",
    );
  });

  it("products are square", () => {
    const meta = buildCatalogMetadata(
      {
        locale: "en",
        path: "/products/zahra",
        title: "ZAHRA",
        image: BLOB,
        ogType: "product",
      },
      { brand: { name: "S", names: ["S"] } },
    );
    const og = meta.openGraph as {
      images: Array<{ height: number; type: string }>;
    };
    expect(og.images[0]).toMatchObject({ height: 1200, type: "image/jpeg" });
  });
});
