import { describe, expect, it } from "vitest";
import {
  homeProduct,
  parseCollectionShowcase,
  parseHeroCampaign,
  parseHeroGallery,
  parseMoodPicker,
  planHome,
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
