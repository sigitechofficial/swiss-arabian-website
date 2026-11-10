import { describe, expect, it } from "vitest";
import { absolutizeJsonLd, plainSchemaText, productJsonLd } from "./CatalogJsonLd";

const base = {
  name: "ZAHRA",
  url: "/products/zahra",
  sku: "ZAHR032801",
  price: 40,
  currency: "AED",
  inStock: true,
};

describe("productJsonLd", () => {
  it("links the product and its seller to the site's Organization", () => {
    const ld = absolutizeJsonLd(
      productJsonLd({ ...base, seller: "Swiss Arabian UAE" }),
      "https://uae.example",
    );
    expect(ld).toMatchObject({
      "@id": "https://uae.example/products/zahra#product",
      offers: {
        seller: {
          "@type": "Organization",
          "@id": "https://uae.example/#organization",
          name: "Swiss Arabian UAE",
        },
      },
    });
  });

  it("writes delivery only from real values, free when the product reaches the threshold", () => {
    const paid = productJsonLd({
      ...base,
      shipping: { country: "ae", fee: "15", freeFrom: "100", minDays: 1, maxDays: 3 },
    });
    expect(paid).toMatchObject({
      offers: {
        shippingDetails: {
          shippingRate: { value: "15.00", currency: "AED" },
          shippingDestination: { addressCountry: "AE" },
          deliveryTime: { transitTime: { minValue: 1, maxValue: 3, unitCode: "DAY" } },
        },
      },
    });

    const free = productJsonLd({
      ...base,
      price: 150,
      shipping: { country: "AE", fee: "15", freeFrom: "100" },
    });
    expect(free.offers?.shippingDetails?.shippingRate.value).toBe("0.00");
    expect(free.offers?.shippingDetails).not.toHaveProperty("deliveryTime");

    const unknownFee = productJsonLd({ ...base, shipping: { country: "AE", fee: null } });
    expect(unknownFee.offers?.shippingDetails).toBeUndefined();
  });

  it("adds notes and reviews, skipping empty ones", () => {
    const ld = productJsonLd({
      ...base,
      properties: [
        { name: "Top notes", value: "Saffron" },
        { name: "Size", value: "" },
      ],
      reviews: [
        { rating: 5, author: "Sara", body: "<p>Lovely</p>", date: "2026-10-01T10:00:00Z" },
        { rating: 4, author: "", body: "" },
      ],
    });
    expect(ld.additionalProperty).toEqual([
      { "@type": "PropertyValue", name: "Top notes", value: "Saffron" },
    ]);
    expect(ld.review).toHaveLength(1);
    expect(ld.review?.[0]).toMatchObject({
      reviewBody: "Lovely",
      datePublished: "2026-10-01",
      author: { name: "Sara" },
    });
  });
});

describe("plainSchemaText", () => {
  it("removes HTML and imported \\n text", () => {
    expect(plainSchemaText("A\\n\\nB <b>C</b>\n\nD")).toBe("A B C D");
    expect(plainSchemaText("  ")).toBeUndefined();
    expect(plainSchemaText("nights.Â The scent")).toBe("nights. The scent");
  });
});
