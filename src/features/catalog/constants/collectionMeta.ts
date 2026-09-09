export type CollectionMeta = {
  eyebrow: string;
  title: string;
  titleEm: string;
  intro: string;
  heroImage: string;
  /** Pre-selects the "Collection" filter-rail group for slugs that map onto
   *  one of our two static house collections. Anything else just shows the
   *  full static catalog with "All collections" selected — there's no live
   *  catalog yet to slice further. */
  filterCollection?: string;
};

const DEFAULT_META: CollectionMeta = {
  eyebrow: "The collection",
  title: "All",
  titleEm: "fragrances.",
  intro:
    "Extraits de parfum and eaux de parfum — the house's signatures, composed in Dubai since 1974.",
  heroImage: "/assets/collection-1.jpg",
};

export const COLLECTION_META: Record<string, CollectionMeta> = {
  "new-launches": {
    eyebrow: "Just in",
    title: "New",
    titleEm: "launches.",
    intro: "The newest additions to the house — fresh compositions, same 1974 craft.",
    heroImage: "/assets/collection-1.jpg",
  },
  perfumes: {
    eyebrow: "The collection",
    title: "All",
    titleEm: "perfumes.",
    intro: "Extraits de parfum and eaux de parfum, composed in Dubai since 1974.",
    heroImage: "/assets/collection-1.jpg",
  },
  "perfume-oils": {
    eyebrow: "Concentrated",
    title: "Perfume",
    titleEm: "oils.",
    intro: "Concentrated oils in the oldest tradition of the house — alcohol-free, long-wearing.",
    heroImage: "/assets/collection-2.jpg",
  },
  incense: {
    eyebrow: "Ritual",
    title: "Oud",
    titleEm: "muattar & bakhoor.",
    intro: "Incense prepared for the ritual at home, the way it has always been done.",
    heroImage: "/assets/collection-4.jpg",
  },
  "best-sellers": {
    eyebrow: "Most loved",
    title: "Best",
    titleEm: "sellers.",
    intro: "The signatures our customers keep returning to.",
    heroImage: "/assets/collection-1.jpg",
  },
  collections: {
    eyebrow: "Curated",
    title: "Our",
    titleEm: "collections.",
    intro: "Curated houses, each with its own character.",
    heroImage: "/assets/collection-3.jpg",
  },
  heritage: {
    eyebrow: "Since 1974",
    title: "Heritage",
    titleEm: "collection.",
    intro: "The house's founding signatures — rose, patchouli, vanilla, tobacco, incense.",
    heroImage: "/assets/collection-2.jpg",
    filterCollection: "heritage",
  },
  shaghaf: {
    eyebrow: "Shaghaf",
    title: "Shaghaf",
    titleEm: "collection.",
    intro: "Oud at the centre — amber, saffron, leather and rose woven around it.",
    heroImage: "/assets/collection-3.jpg",
    filterCollection: "shaghaf",
  },
  minis: {
    eyebrow: "Try first",
    title: "Minis &",
    titleEm: "travel sizes.",
    intro: "The full catalogue, sized down for a first try or a carry-on.",
    heroImage: "/assets/collection-2.jpg",
  },
  bundles: {
    eyebrow: "Save more",
    title: "Bundles &",
    titleEm: "sets.",
    intro: "Paired signatures, priced better together.",
    heroImage: "/assets/collection-4.jpg",
  },
  "fresh-citrus": {
    eyebrow: "Shop by note",
    title: "Fresh /",
    titleEm: "citrus.",
    intro: "Bright bergamot, lemon and green openings — the lightest way into the house.",
    heroImage: "/assets/collection-1.jpg",
  },
  aromatic: {
    eyebrow: "Shop by note",
    title: "Aromatic",
    titleEm: "notes.",
    intro: "Lavender, herbs and cool greens — composed for clarity and lift.",
    heroImage: "/assets/collection-2.jpg",
  },
  woody: {
    eyebrow: "Shop by note",
    title: "Woody",
    titleEm: "notes.",
    intro: "Cedar, sandalwood and moss — the dry, lasting heart of the catalogue.",
    heroImage: "/assets/collection-4.jpg",
  },
  gourmand: {
    eyebrow: "Shop by note",
    title: "Gourmand",
    titleEm: "notes.",
    intro: "Vanilla, tonka and cacao — warm, edible accords for evening wear.",
    heroImage: "/assets/collection-2.jpg",
  },
  floral: {
    eyebrow: "Shop by note",
    title: "Floral",
    titleEm: "notes.",
    intro: "Rose, peony and white flowers — the house's most romantic signatures.",
    heroImage: "/assets/collection-3.jpg",
  },
  spicy: {
    eyebrow: "Shop by note",
    title: "Spicy",
    titleEm: "notes.",
    intro: "Cinnamon, pepper and anise — heat woven through oud and amber.",
    heroImage: "/assets/collection-4.jpg",
  },
  fruity: {
    eyebrow: "Shop by note",
    title: "Fruity",
    titleEm: "notes.",
    intro: "Fig, berry and orchard accords — ripe openings over a musky base.",
    heroImage: "/assets/collection-3.jpg",
  },
  oriental: {
    eyebrow: "Shop by note",
    title: "Oriental",
    titleEm: "notes.",
    intro: "Oud, amber, incense and resin — the drama and grandeur of the Orient.",
    heroImage: "/assets/collection-4.jpg",
  },
};

export function getCollectionMeta(slug?: string): CollectionMeta {
  if (!slug) return DEFAULT_META;
  return COLLECTION_META[slug] ?? { ...DEFAULT_META, title: toTitle(slug) };
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
