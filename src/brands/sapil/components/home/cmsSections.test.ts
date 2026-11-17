import { describe, expect, it } from "vitest";
import {
  homeProduct,
  parseCollectionShowcase,
  parseHeroCampaign,
  parseHeroGallery,
  parseMoodPicker,
  parseProductRail,
  planHome,
  sectionCopy,
  textParts,
} from "./cmsSections";
import { FIXTURE_HOME_SECTIONS, FIXTURE_PRODUCTS } from "./fixtures";
import { priceBands, shelfPicks } from "./PriceEditShelf";
import { spinTarget } from "./MoodWheel";

describe("textParts", () => {
  it("prefers the resolver's parts, else splits around the emphasis", () => {
    expect(textParts("x", null, [{ text: "The Art of ", emphasis: false }, { text: "Scent", emphasis: true }])).toHaveLength(2);
    expect(textParts("The Art of Scent", "Scent")).toEqual([
      { text: "The Art of ", emphasis: false },
      { text: "Scent", emphasis: true },
    ]);
    expect(textParts("Juicy pop", "missing")).toEqual([{ text: "Juicy pop", emphasis: false }]);
    expect(textParts(null, null)).toEqual([]);
  });
});

describe("planHome", () => {
  it("draws the v9 sections in CMS order, groups bundles, adds the price edit and skips unknown types", () => {
    const kinds = planHome(FIXTURE_HOME_SECTIONS).map((b) => b.kind);
    expect(kinds).toEqual([
      "heroGallery",
      "newArrivals",
      "priceEdit",
      "collections",
      "topSellers",
      "mood",
      "notes",
      "bundles",
      "reels",
      "about",
    ]);
    const bundles = planHome(FIXTURE_HOME_SECTIONS).find((b) => b.kind === "bundles");
    expect(bundles && bundles.kind === "bundles" && bundles.bundles.map((b) => b.heading)).toEqual(["The Fruity Four", "His & Hers"]);
  });

  it("uses the first section's hero layout", () => {
    const video = planHome([{ id: "v", type: "SHOPABLE_VIDEO_SHOWCASE", position: 0, data: {} }]);
    expect(video[0].kind).toBe("heroVideo");
    const promo = planHome([{ id: "p", type: "BUNDLE_PROMOTION_SHOWCASE", position: 0, data: { heading: "Offer", products: FIXTURE_PRODUCTS } }]);
    expect(promo[0].kind).toBe("heroPromo");
    const campaign = planHome([{ id: "c", type: "HERO_BANNER", position: 0, data: { desktopImage: "/a.jpg", heading: "Bloom" } }]);
    expect(campaign[0].kind).toBe("heroCampaign");
  });

  it("never throws on malformed data", () => {
    expect(planHome([{ id: "x", type: "HERO_GALLERY", position: 0, data: null as never }, { id: "y", type: "MOOD_PICKER", position: 1, data: { moods: "no" } }])).toEqual([]);
  });
});

describe("homeProduct", () => {
  it("keeps the market was-price only when above the price", () => {
    const card = { ...FIXTURE_PRODUCTS[0], priceSummary: { price: "63", currencyCode: "AED", compareAtPrice: "90" } };
    expect(homeProduct(card)?.wasPrice).toBe(90);
    expect(homeProduct({ ...card, priceSummary: { price: "63", currencyCode: "AED", compareAtPrice: "50" } })?.wasPrice).toBeNull();
    expect(homeProduct(FIXTURE_PRODUCTS[0])?.wasPrice).toBeNull();
    expect(homeProduct({ name: "no slug" })).toBeNull();
  });

  it("puts the tile and was-price on the product, for the shared SapilProductCard", () => {
    const card = { ...FIXTURE_PRODUCTS[0], tileColor: "mint", priceSummary: { price: "63", currencyCode: "AED", compareAtPrice: "90" } };
    const product = homeProduct(card)?.product;
    expect(product?.tileColor).toBe("mint");
    expect(product?.compareAtPrice).toBe(90);
    expect(homeProduct(FIXTURE_PRODUCTS[0])?.product.compareAtPrice ?? null).toBeNull();
  });
});

describe("section parsers", () => {
  it("keeps hero rooms that have their collection and piece, clamps the open door", () => {
    const hero = parseHeroGallery({
      heading: "The Art of Scent",
      initialRoomIndex: 9,
      rooms: [
        { id: "a", number: "I", title: "Juicy pop", wallColor: "pink", collection: { id: "c", slug: "fruity", name: "Fruity" }, product: FIXTURE_PRODUCTS[0] },
        { id: "b", number: "II", title: "Gone", wallColor: "nope", collection: null, product: FIXTURE_PRODUCTS[1] },
      ],
    });
    expect(hero?.rooms).toHaveLength(1);
    expect(hero?.rooms[0].wall).toBe("pink");
    expect(hero?.rooms[0].piece.tileColor).toBe("pink");
    expect(hero?.initialRoom).toBe(0);
    expect(parseHeroGallery({ heading: "x", rooms: [] })).toBeNull();
  });

  it("needs two moods with products", () => {
    expect(parseMoodPicker({ moods: [{ id: "a", name: "A", products: FIXTURE_PRODUCTS }] })).toBeNull();
    const picker = parseMoodPicker({ moods: [{ name: "A", color: "mint", products: FIXTURE_PRODUCTS }, { name: "B", products: FIXTURE_PRODUCTS.slice(0, 1) }] });
    expect(picker?.moods.map((m) => m.color)).toEqual(["mint", "peach"]);
    expect(picker?.moods[0].products).toHaveLength(4);
  });

  it("reads collection summaries", () => {
    const show = parseCollectionShowcase(FIXTURE_HOME_SECTIONS[2].data);
    expect(show?.cards[0]).toMatchObject({ title: "Fruity Capsules", count: 4, fromPrice: 63, currency: "AED", color: "pink" });
    expect(show?.cards[0].images).toHaveLength(3);
  });

  it("builds campaign slides from a slider", () => {
    const hero = parseHeroCampaign("HERO_SLIDER", {
      autoplayIntervalMs: 100,
      slides: [{ id: "1", desktopImage: "/a.jpg", heading: "Bloom", ctaLabel: "Shop", link: { type: "INTERNAL_PATH", url: "/products" } }, { id: "2" }],
    });
    expect(hero?.slides).toHaveLength(1);
    expect(hero?.slides[0].primary).toEqual({ label: "Shop", href: "/products" });
    expect(hero?.intervalMs).toBe(6500);
  });
});

describe("price edit helpers", () => {
  it("bands prices up to the ceiling like v9", () => {
    expect(priceBands([15, 30, 63, 89, 99], 99)).toEqual([
      { key: "b0", min: null, max: 24, count: 1 },
      { key: "b1", min: 25, max: 49, count: 1 },
      { key: "b2", min: 50, max: 74, count: 1 },
      { key: "b3", min: 75, max: 99, count: 2 },
    ]);
  });
  it("picks up to five bottles, one per price first", () => {
    const products = [63, 63, 89, 99, 120, 15].map((price, i) => ({ id: String(i), slug: String(i), title: String(i), price, currency: "AED", imageUrl: "/x.png" }));
    expect(shelfPicks(products).map((p) => p.id)).toEqual(["0", "2", "3", "4", "5"]);
  });
});

describe("spinTarget", () => {
  it("lands the chosen segment under the pointer after the turns", () => {
    const r = spinTarget(-30, 2, 6, 1);
    expect(((r % 360) + 360) % 360).toBe(((-(2 * 60 + 30) % 360) + 360) % 360);
    expect(r).toBeGreaterThan(-30 + 360 - 1);
  });
});

describe("section heading copy", () => {
  it("reads a rail's title, emphasis, subtitle and the price shelf's copy", () => {
    const rail = parseProductRail({
      products: FIXTURE_PRODUCTS,
      heading: " New in ",
      title: "Just landed, still fizzing.",
      titleEmphasis: "still fizzing.",
      subtitle: "Fresh this week.",
      priceEditEyebrow: "Small treats",
      priceEditTitle: "Big scent, small price.",
      priceEditTitleEmphasis: "small price.",
    });
    expect(rail).toMatchObject({
      heading: "New in",
      title: [
        { text: "Just landed, ", emphasis: false },
        { text: "still fizzing.", emphasis: true },
      ],
      subtitle: "Fresh this week.",
      priceEdit: { eyebrow: "Small treats", title: [{ text: "Big scent, ", emphasis: false }, { text: "small price.", emphasis: true }] },
    });
  });

  it("leaves empty fields empty, so the built-in copy stays", () => {
    const rail = parseProductRail({ products: FIXTURE_PRODUCTS, title: "  ", titleEmphasis: "x", subtitle: "" });
    expect(rail).toMatchObject({ heading: null, title: [], subtitle: null, priceEdit: { eyebrow: null, title: [] } });
    // a title without (or with a missing) emphasis is all plain
    expect(sectionCopy({ title: "Loved by all" }).title).toEqual([{ text: "Loved by all", emphasis: false }]);
    expect(sectionCopy({ title: "Loved by all", titleEmphasis: "nope" }).title).toEqual([{ text: "Loved by all", emphasis: false }]);
  });

  it("puts the copy on the collections, notes, reels, video hero and bundle row blocks", () => {
    const head = { heading: "Label", title: "Big heading", titleEmphasis: "heading", subtitle: "Line" };
    const parts = [
      { text: "Big ", emphasis: false },
      { text: "heading", emphasis: true },
    ];
    const blocks = planHome(
      FIXTURE_HOME_SECTIONS.map((s) => {
        const data = s.data as Record<string, unknown>;
        if (["collections", "notes", "reels"].includes(s.id)) return { ...s, data: { ...data, ...head } };
        if (s.id === "new") return { ...s, data: { ...data, priceEditTitle: "Under a hundred" } };
        if (s.id === "b1") return { ...s, data: { ...data, rowEyebrow: "Sets", rowTitle: "Better together", rowTitleEmphasis: "together", rowSubtitle: "One tap." } };
        return s;
      }),
    );
    const by = <K extends string>(kind: K) => blocks.find((b) => b.kind === kind);
    expect(by("collections")).toMatchObject({ showcase: { heading: "Label", title: parts, text: "Line" } });
    expect(by("notes")).toMatchObject({ heading: "Label", title: parts, subtitle: "Line" });
    expect(by("reels")).toMatchObject({ heading: "Label", title: parts, subtitle: "Line" });
    expect(by("priceEdit")).toMatchObject({ copy: { eyebrow: null, title: [{ text: "Under a hundred", emphasis: false }] } });
    const bundles = by("bundles");
    expect(bundles?.kind === "bundles" && bundles.bundles[0].row).toEqual({
      heading: "Sets",
      title: [
        { text: "Better ", emphasis: false },
        { text: "together", emphasis: true },
      ],
      subtitle: "One tap.",
    });
    expect(bundles?.kind === "bundles" && bundles.bundles[1].row).toEqual({ heading: null, title: [], subtitle: null });

    const hero = planHome([{ id: "v", type: "SHOPABLE_VIDEO_SHOWCASE", position: 0, data: head }]);
    expect(hero[0]).toMatchObject({ kind: "heroVideo", heading: "Label", title: parts, subtitle: "Line" });
    expect(planHome([{ id: "v", type: "SHOPABLE_VIDEO_SHOWCASE", position: 0, data: {} }])[0]).toMatchObject({ heading: null, title: [], subtitle: null });
  });
});
