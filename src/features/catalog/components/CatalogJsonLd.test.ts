import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import {
  absolutizeJsonLd,
  faqPageJsonLd,
  merchantReturnPolicy,
  pageBreadcrumbJsonLd,
  productJsonLd,
  type MarketReturnTerms,
  storeJsonLd,
  storesJsonLd,
} from "./CatalogJsonLd";

const ORIGIN = "https://uae.swissarabian.com";
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

describe("page structured data builders", () => {
  it("breadcrumb: Home › page, with the language prefix, absolute on the market domain", async () => {
    const data = await pageBreadcrumbJsonLd("ar", { name: "الأسئلة الشائعة", path: "/faq" });
    expect(absolutizeJsonLd(data, ORIGIN)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${ORIGIN}/ar` },
        { "@type": "ListItem", position: 2, name: "الأسئلة الشائعة", item: `${ORIGIN}/ar/faq` },
      ],
    });
    expect((await pageBreadcrumbJsonLd("en", { name: "FAQs", path: "/faq" })).itemListElement[1]?.item).toBe("/faq");
  });

  it("FAQPage: one Question with an accepted Answer per entry", () => {
    expect(faqPageJsonLd([{ question: "Q?", answer: "A." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } }],
    });
  });

  it("Store: real fields only, brand as parent organization", () => {
    const hours = [
      { "@type": "OpeningHoursSpecification" as const, dayOfWeek: ["Monday"], opens: "10:00", closes: "22:00" },
    ];
    const full = storeJsonLd(
      {
        id: "dalma",
        name: "Dalma Mall",
        url: "/stores",
        streetAddress: " Unit 1, Dalma Mall, Abu Dhabi ",
        addressCountry: "AE",
        telephone: "+971 50 000 0000",
        geo: { latitude: 24.3, longitude: 54.5 },
        openingHours: hours,
      },
      "Swiss Arabian",
    );
    expect(plain(absolutizeJsonLd(full, ORIGIN))).toEqual({
      "@type": "Store",
      "@id": `${ORIGIN}/stores#store-dalma`,
      name: "Dalma Mall",
      url: `${ORIGIN}/stores`,
      address: { "@type": "PostalAddress", streetAddress: "Unit 1, Dalma Mall, Abu Dhabi", addressCountry: "AE" },
      geo: { "@type": "GeoCoordinates", latitude: 24.3, longitude: 54.5 },
      telephone: "+971 50 000 0000",
      openingHoursSpecification: hours,
      parentOrganization: { "@type": "Organization", name: "Swiss Arabian" },
    });

    const bare = storeJsonLd({ id: "k", name: "Kiosk", url: "/stores", geo: { latitude: NaN, longitude: 1 } });
    expect(plain(bare)).toEqual({ "@type": "Store", "@id": "/stores#store-k", name: "Kiosk", url: "/stores" });
  });

  it("stores: one graph with every store", () => {
    const data = storesJsonLd(
      [
        { id: "a", name: "A", url: "/stores" },
        { id: "b", name: "B", url: "/stores" },
      ],
      "Brand",
    );
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"].map((store) => store.name)).toEqual(["A", "B"]);
  });
});

/** SEO audit p17: the product offer names the market's return policy. */
describe("merchantReturnPolicy", () => {
  const terms = (over: Partial<MarketReturnTerms> = {}, items: MarketReturnTerms["items"] = []): MarketReturnTerms => ({
    returnsEnabled: true,
    returnWindowDays: 14,
    currencyCode: "AED",
    items,
    ...over,
  });

  it("free returns within the market's window", () => {
    expect(
      merchantReturnPolicy(terms({}, [{ key: "RETURN_SHIPPING_FEE", variant: "FREE", values: {} }]), "ae"),
    ).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "AE",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    });
  });

  it("a return shipping fee and a restocking fee", () => {
    const policy = merchantReturnPolicy(
      terms({ returnWindowDays: 7 }, [
        { key: "RETURN_SHIPPING_FEE", variant: "FLAT", values: { amount: "25.00", currencyCode: "AED" } },
        { key: "RESTOCKING_FEE", variant: "PERCENT_ALWAYS", values: { percent: "10" } },
      ]),
      "AE",
    );
    expect(policy).toMatchObject({
      merchantReturnDays: 7,
      returnFees: "https://schema.org/ReturnShippingFees",
      returnShippingFeesAmount: { "@type": "MonetaryAmount", value: "25.00", currency: "AED" },
      restockingFee: 10,
    });
  });

  it("returns switched off: not permitted", () => {
    expect(merchantReturnPolicy(terms({ returnsEnabled: false }), "QA")).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "QA",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    });
  });

  it("nothing is guessed without the policy or the country", () => {
    expect(merchantReturnPolicy(null, "AE")).toBeUndefined();
    expect(merchantReturnPolicy(terms(), null)).toBeUndefined();
    expect(merchantReturnPolicy(terms({ returnWindowDays: 0 }), "AE")).toBeUndefined();
  });

  it("is part of the product offer", () => {
    const product = productJsonLd({
      name: "Shaghaf Oud",
      url: "/products/shaghaf-oud",
      price: 100,
      currency: "AED",
      shipping: { country: "AE" },
      returnPolicy: terms({}, [{ key: "RETURN_SHIPPING_FEE", variant: "FREE", values: {} }]),
    });
    expect(plain(product).offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(14);
    expect(plain(product).offers.shippingDetails).toBeUndefined();
  });
});
