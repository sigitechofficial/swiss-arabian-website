import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { absolutizeJsonLd, productJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { catalogMetadata } from "./catalogPage";
import { absoluteUrl, originFromHeaders } from "./requestOrigin";

const headersOf = (values: Record<string, string>) => (name: string) => values[name] ?? null;

describe("SEO addresses and product data", () => {
  it("origin: forwarded host/proto win; localhost is http; others default to https", () => {
    expect(
      originFromHeaders(
        headersOf({ "x-forwarded-host": "qa.swissarabian.com, edge", "x-forwarded-proto": "https", host: "127.0.0.1:3004" }),
      ),
    ).toBe("https://qa.swissarabian.com");
    expect(originFromHeaders(headersOf({ host: "localhost:3004" }))).toBe("http://localhost:3004");
    expect(originFromHeaders(headersOf({ host: "uae.swissarabian.com" }))).toBe("https://uae.swissarabian.com");
    expect(originFromHeaders(headersOf({}))).toBeNull();
  });

  it("structured data: site paths become absolute; other text is unchanged", () => {
    const origin = "https://uae.swissarabian.com";
    expect(absoluteUrl(origin, "/products/x")).toBe("https://uae.swissarabian.com/products/x");
    expect(absoluteUrl(origin, "https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg");
    expect(
      absolutizeJsonLd(
        {
          url: "/products/x",
          name: "/not a url field",
          itemListElement: [{ item: "/collections/men" }],
        },
        origin,
      ),
    ).toEqual({
      url: "https://uae.swissarabian.com/products/x",
      name: "/not a url field",
      itemListElement: [{ item: "https://uae.swissarabian.com/collections/men" }],
    });
  });

  it("product: price, currency, stock, brand and rating like the Shopify page", () => {
    const ld = productJsonLd({
      name: "LEATHER AND OUD",
      url: "/products/leather-and-oud",
      sku: "LOUD141201",
      image: "https://blob/a.webp",
      images: ["https://blob/a.webp", "https://blob/b.webp"],
      price: 120,
      currency: "QAR",
      inStock: true,
      rating: { average: 4.75, count: 8 },
    });
    expect(ld).toMatchObject({
      image: ["https://blob/a.webp", "https://blob/b.webp"],
      brand: { "@type": "Brand", name: "Swiss Arabian" },
      offers: {
        price: "120.00",
        priceCurrency: "QAR",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: { ratingValue: 4.75, reviewCount: 8 },
    });
    expect(productJsonLd({ name: "x", url: "/p", price: null }).offers).toBeUndefined();
  });

  it("titles that already name the brand are not suffixed again; share image set", () => {
    const meta = catalogMetadata({
      locale: "en",
      path: "/products/leather-and-oud",
      title: "Leather & Oud – Citrus Leather Oud EDP | Swiss Arabian UAE",
      image: "https://blob/a.webp",
    });
    expect(meta.title).toEqual({ absolute: "Leather & Oud – Citrus Leather Oud EDP | Swiss Arabian UAE" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.openGraph).toMatchObject({ siteName: "Swiss Arabian", images: [{ url: "https://blob/a.webp" }] });
    expect(catalogMetadata({ locale: "en", path: "/collections/men", title: "Men" }).title).toBe("Men");
  });
});
