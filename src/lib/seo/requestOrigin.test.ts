import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import {
  absolutizeJsonLd,
  productJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { buildCatalogMetadata } from "./catalogPage";
import { absoluteUrl, originFromHeaders } from "./requestOrigin";

const headersOf = (values: Record<string, string>) => (name: string) =>
  values[name] ?? null;

describe("SEO addresses and product data", () => {
  it("origin: forwarded host/proto win; localhost is http; others default to https", () => {
    expect(
      originFromHeaders(
        headersOf({
          "x-forwarded-host": "qa.swissarabian.com, edge",
          "x-forwarded-proto": "https",
          host: "127.0.0.1:3004",
        }),
      ),
    ).toBe("https://qa.swissarabian.com");
    expect(originFromHeaders(headersOf({ host: "localhost:3004" }))).toBe(
      "http://localhost:3004",
    );
    expect(originFromHeaders(headersOf({ host: "uae.swissarabian.com" }))).toBe(
      "https://uae.swissarabian.com",
    );
    expect(originFromHeaders(headersOf({}))).toBeNull();
  });

  it("structured data: site paths become absolute; other text is unchanged", () => {
    const origin = "https://uae.swissarabian.com";
    expect(absoluteUrl(origin, "/products/x")).toBe(
      "https://uae.swissarabian.com/products/x",
    );
    expect(absoluteUrl(origin, "https://cdn.example/a.jpg")).toBe(
      "https://cdn.example/a.jpg",
    );
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
      itemListElement: [
        { item: "https://uae.swissarabian.com/collections/men" },
      ],
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
      brand: "Swiss Arabian",
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
    const bare = productJsonLd({ name: "x", url: "/p", price: null });
    expect(bare.offers).toBeUndefined();
    expect(bare.brand).toBeUndefined();
  });

  it("titles that already name the brand are not suffixed again; share image set", () => {
    const brand = { name: "Swiss Arabian", names: ["Swiss Arabian", "سويس أرابيان"] };
    const meta = buildCatalogMetadata(
      {
        locale: "en",
        path: "/products/leather-and-oud",
        title: "Leather & Oud – Citrus Leather Oud EDP | Swiss Arabian UAE",
        image: "https://blob/a.webp",
      },
      { brand, countryCode: "AE" },
    );
    expect(meta.title).toEqual({
      absolute: "Leather & Oud – Citrus Leather Oud EDP | Swiss Arabian UAE",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.openGraph).toMatchObject({
      siteName: "Swiss Arabian",
      locale: "en_AE",
      images: [{ url: "https://blob/a.webp" }],
    });
    expect(
      buildCatalogMetadata(
        { locale: "en", path: "/collections/men", title: "Men" },
        { brand },
      ).title,
    ).toBe("Men");
    expect(
      buildCatalogMetadata(
        { locale: "ar", path: "/collections/men", title: "رجال | سويس أرابيان" },
        { brand, countryCode: "QA" },
      ),
    ).toMatchObject({
      title: { absolute: "رجال | سويس أرابيان" },
      openGraph: { locale: "ar_QA" },
    });
  });

  it("adds the market name unless the title has the full market name (as Shopify)", () => {
    const brand = { name: "Swiss Arabian UAE", names: ["Swiss Arabian UAE", "Swiss Arabian"] };
    const title = (t: string) =>
      buildCatalogMetadata({ locale: "en", path: "/products/x", title: t }, { brand }).title;
    // Shopify: "Shumoukh Al Ghutra Eau De Perfume 100ml - Swiss Arabian – Swiss Arabian UAE"
    expect(title("Shumoukh Al Ghutra Eau De Perfume 100ml - Swiss Arabian")).toBe(
      "Shumoukh Al Ghutra Eau De Perfume 100ml - Swiss Arabian",
    );
    expect(title("SWISS ARABIAN EXCLUSIVE COLLECTION")).toBe("SWISS ARABIAN EXCLUSIVE COLLECTION");
    expect(title("Valencia EDP | Amber Floral – Swiss Arabian UAE")).toEqual({
      absolute: "Valencia EDP | Amber Floral – Swiss Arabian UAE",
    });
  });
});
