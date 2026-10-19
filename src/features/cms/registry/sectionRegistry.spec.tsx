import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderCmsSection, renderCmsSections } from "./sectionRegistry";
import type { CmsSection } from "../types/cmsHome.types";

vi.mock("../components/sections/CmsProductStripSection", () => ({
  CmsProductStripSection: (props: { title: string }) => (
    <section data-testid="product-strip">{props.title}</section>
  ),
}));

function section(
  id: string,
  type: string,
  position: number,
  data: Record<string, unknown>,
): CmsSection {
  return { id, type, position, data };
}

describe("renderCmsSections", () => {
  it("orders by position", () => {
    const sections = [
      section("b", "TEXT_BLOCK", 2, { body: "Second" }),
      section("a", "TEXT_BLOCK", 1, { body: "First" }),
    ];
    const html = renderToStaticMarkup(<>{renderCmsSections(sections)}</>);
    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
  });

  it("skips unknown section types without crashing", () => {
    const sections = [
      section("x", "UNKNOWN_TYPE", 1, { foo: 1 }),
      section("t", "TEXT_BLOCK", 2, { body: "Hello" }),
    ];
    const html = renderToStaticMarkup(
      <>{renderCmsSections(sections, { logUnknown: false })}</>,
    );
    expect(html).toContain("Hello");
    expect(html).not.toContain("UNKNOWN");
  });

  it("omits empty product strips", () => {
    const node = renderCmsSection(
      section("p", "TRENDING_PRODUCTS", 1, {
        heading: "Trending",
        products: [],
      }),
    );
    expect(node).toBeNull();
  });

  it("renders HERO_BANNER when desktop image present", () => {
    const sections = [
      section("h", "HERO_BANNER", 1, {
        desktopImage: "https://cdn.example.com/hero.jpg",
        heading: "Welcome",
      }),
    ];
    const html = renderToStaticMarkup(<>{renderCmsSections(sections)}</>);
    expect(html).toContain("Welcome");
    expect(html).toContain("https://cdn.example.com/hero.jpg");
  });

  it("supports existing and Phase 2C section types", () => {
    const products = [
      {
        productId: "11111111-1111-1111-1111-111111111111",
        slug: "test-oud",
        name: "Test Oud",
        image: "https://cdn.example.com/p.jpg",
        isSellable: true,
        isVisible: true,
        priceSummary: { price: 100, currencyCode: "AED", hasValidPrice: true },
        inventorySummary: { hasAvailableInventory: true, availableQty: 2 },
      },
    ];
    const categories = [{ id: "cat-1", slug: "men", name: "Men" }];
    const types: Array<[string, Record<string, unknown>]> = [
      ["HERO_BANNER", { desktopImage: "https://cdn.example.com/h.jpg", heading: "H" }],
      [
        "HERO_SLIDER",
        {
          slides: [{ id: "s1", desktopImage: "https://cdn.example.com/h.jpg" }],
          heading: "Slider",
        },
      ],
      ["IMAGE_BANNER", { desktopImage: "https://cdn.example.com/b.jpg" }],
      ["TEXT_BLOCK", { body: "Copy" }],
      [
        "TRUST_INDICATORS",
        {
          items: [
            { id: "t1", headingLine1: "Free", headingLine2: "Returns", text: "ok" },
          ],
        },
      ],
      ["CATEGORY_GRID", { categories, heading: "Cats" }],
      ["CATEGORY_CAROUSEL", { categories }],
      [
        "COLLECTION_SHOWCASE",
        { tiles: [{ id: "c1", title: "For Him", href: "/collections/him" }] },
      ],
      ["PRODUCT_CAROUSEL", { products, heading: "PC" }],
      ["TRENDING_PRODUCTS", { products }],
      ["FEATURED_COLLECTION", { products, heading: "FC" }],
      ["IMAGE_WITH_TEXT", { image: "https://cdn.example.com/i.jpg", heading: "Editorial" }],
      [
        "BRAND_STORY",
        {
          heading: "Our story",
          paragraphs: ["Legacy copy"],
          image: "https://cdn.example.com/s.jpg",
        },
      ],
      [
        "BUNDLE_PROMOTION_SHOWCASE",
        { desktopImage: "https://cdn.example.com/bundle.jpg", products },
      ],
      [
        "TESTIMONIALS",
        {
          items: [
            { id: "r1", body: "Great", reviewerName: "Amira", verifiedBuyer: false },
          ],
        },
      ],
      [
        "SUBSCRIPTION_PLANS_SHOWCASE",
        {
          plans: [
            { id: "p1", name: "Discovery", displayPrice: "AED 99", featured: false },
          ],
        },
      ],
      ["NEWSLETTER_SIGNUP", { heading: "Join" }],
      ["FRAGRANCE_NOTES_SHOWCASE", { heading: "Shop by Fragrance Notes" }],
      ["SHOPABLE_VIDEO_SHOWCASE", {}],
    ];

    for (const [type, data] of types) {
      const node = renderCmsSection(section(type, type, 1, data));
      expect(node, type).not.toBeNull();
    }
  });
});
