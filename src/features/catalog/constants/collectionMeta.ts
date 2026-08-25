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
