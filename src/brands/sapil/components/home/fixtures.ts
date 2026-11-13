/**
 * A Sapil homepage as the backend resolves it (feat/sapil-cms contract), with
 * v9's mock content. Used by tests and the dev preview / visual diff only; the
 * live page always renders the market's own published homepage.
 */
import type { CmsSection } from "@/features/cms/types/cmsHome.types";

const CDN = "https://sapil.com/cdn/shop/files/";

const card = (n: number, name: string, price: number, image: string, tileColor: string | null = null) => ({
  productId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  variantId: `v-${n}`,
  sku: `SKU${n}`,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  image: `${CDN}${image}`,
  priceSummary: { price: String(price), currencyCode: "AED", hasValidPrice: true },
  inventorySummary: { availableQty: 10, hasAvailableInventory: true },
  isVisible: true,
  isSellable: true,
  tileColor,
});

export const FIXTURE_PRODUCTS = [
  card(1, "Berry Crush", 63, "Straight-angle_cdd31f2a-19e7-4d6a-9be2-a0f992d7eb74.webp", "pink"),
  card(2, "Sarab Sheer", 89, "sarab-sheer.webp", "peach"),
  card(3, "Ember Blaze", 120, "ember-blaze.webp", "sand"),
  card(4, "Royale Oud", 149, "royale-oud.webp", "sky"),
  card(5, "Chichi", 99, "chichi.webp", "lilac"),
];

export const FIXTURE_HOME_SECTIONS: CmsSection[] = [
  {
    id: "hero",
    type: "HERO_GALLERY",
    position: 0,
    data: {
      eyebrow: "Sapil presents · A permanent exhibition",
      heading: "The Art of Scent",
      headingEmphasis: "Scent",
      lead: "Seven rooms. Open a door to meet the piece on show, or walk through the whole gallery.",
      ctaLabel: "Enter the gallery →",
      link: { type: "INTERNAL_PATH", url: "#collections" },
      secondaryCtaLabel: "Find by note",
      secondaryLink: { type: "INTERNAL_PATH", url: "#notes" },
      initialRoomIndex: 2,
      autoAdvance: true,
      rooms: FIXTURE_PRODUCTS.map((p, i) => ({
        id: `room-${i}`,
        number: ["I", "II", "III", "IV", "V"][i],
        title: ["Juicy pop", "The mirage", "Fire and gold", "The royal court", "The classics"][i],
        titleEmphasis: ["pop", "mirage", "gold", "court", "classics"][i],
        wallColor: ["pink", "sand", "sand", "sky", "lilac"][i],
        collectionId: `c-${i}`,
        productId: p.productId,
        collection: { id: `c-${i}`, slug: `line-${i}`, name: ["Fruity Capsules", "Sarab", "Alchemy", "Royale", "Signature"][i] },
        product: p,
      })),
    },
  },
  { id: "new", type: "PRODUCT_CAROUSEL", position: 1, data: { source: "COLLECTION", products: FIXTURE_PRODUCTS } },
  {
    id: "collections",
    type: "COLLECTION_SHOWCASE",
    position: 2,
    data: {
      layoutVariant: "scrollStory",
      tiles: [
        { id: "t1", title: "Fruity Capsules", supportingText: "Juicy, playful, pocket-sized", href: "/collections/fruity", summary: { productCount: 4, minPrice: "63", currencyCode: "AED", images: FIXTURE_PRODUCTS.slice(0, 3).map((p) => ({ url: p.image, name: p.name, tileColor: "pink" })) } },
        { id: "t2", title: "Royale", supportingText: "Regal ouds for grand entrances", href: "/collections/royale", summary: { productCount: 6, minPrice: "149", currencyCode: "AED", images: [] } },
      ],
    },
  },
  { id: "best", type: "TRENDING_PRODUCTS", position: 3, data: { strategy: "BEST_SELLING", products: [...FIXTURE_PRODUCTS].reverse() } },
  {
    id: "mood",
    type: "MOOD_PICKER",
    position: 4,
    data: {
      moods: [
        { id: "m1", name: "Main character", color: "pink", line: "All eyes, zero apologies.", notes: ["Peony", "Berries", "Vanilla"], products: FIXTURE_PRODUCTS.slice(0, 3) },
        { id: "m2", name: "Beach day", color: "butter", line: "Salt, sun and pineapple.", notes: ["Coconut"], products: FIXTURE_PRODUCTS.slice(2, 5) },
      ],
    },
  },
  { id: "notes", type: "FRAGRANCE_NOTES_SHOWCASE", position: 5, data: {} },
  { id: "b1", type: "BUNDLE_PROMOTION_SHOWCASE", position: 6, data: { heading: "The Fruity Four", eyebrow: "Bundle", desktopImage: "/x.jpg", products: FIXTURE_PRODUCTS.slice(0, 4) } },
  { id: "b2", type: "BUNDLE_PROMOTION_SHOWCASE", position: 7, data: { heading: "His & Hers", desktopImage: "/x.jpg", products: FIXTURE_PRODUCTS.slice(3, 5) } },
  { id: "reels", type: "SHOPABLE_VIDEO_SHOWCASE", position: 8, data: {} },
  {
    id: "about",
    type: "BRAND_STORY",
    position: 9,
    data: {
      eyebrow: "About Sapil",
      heading: "Fragrance made to be worn every day.",
      paragraphs: ["Sapil was created to make fine fragrance part of everyday life."],
      image: `${CDN}about.jpg`,
      statistics: [{ id: "s1", value: "80+", label: "countries" }],
    },
  },
  { id: "mystery", type: "SOMETHING_NEW", position: 10, data: {} },
];
