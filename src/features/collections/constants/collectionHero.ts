/** Static hero art + copy per collection slug (filhal until CMS banners). */

export type CollectionHeroConfig = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  sectionEyebrow: string;
  sectionAccent: string;
};

const DEFAULT_HERO: CollectionHeroConfig = {
  image: "/assets/catalog/hero.jpg",
  eyebrow: "Swiss Arabian",
  title: "Collection",
  subtitle: "Signature Fragrances",
  sectionEyebrow: "Explore the edit",
  sectionAccent: "Fragrances",
};

const BY_SLUG: Record<string, CollectionHeroConfig> = {
  minis: {
    image: "/assets/home/collection-new-in.jpg",
    eyebrow: "Swiss Arabian",
    title: "Minis",
    subtitle: "Travel-size favourites to discover & gift",
    sectionEyebrow: "Small size · Full character",
    sectionAccent: "Minis",
  },
  bundles: {
    image: "/assets/catalog/hero.jpg",
    eyebrow: "Swiss Arabian",
    title: "Bundles",
    subtitle: "Curated sets · better value",
    sectionEyebrow: "Discover our range",
    sectionAccent: "Bundles",
  },
  "new-launches": {
    image: "/assets/home/collection-new-in.jpg",
    eyebrow: "Swiss Arabian",
    title: "New Launches",
    subtitle: "The latest from the house",
    sectionEyebrow: "Just arrived",
    sectionAccent: "New",
  },
  "best-sellers": {
    image: "/assets/home/collection-best-sellers.jpg",
    eyebrow: "Swiss Arabian",
    title: "Best Sellers",
    subtitle: "Most-loved compositions",
    sectionEyebrow: "Customer favourites",
    sectionAccent: "Best Sellers",
  },
  perfumes: {
    image: "/assets/home/collection-for-her.jpg",
    eyebrow: "Swiss Arabian",
    title: "Perfumes",
    subtitle: "Eau de parfum & signature scents",
    sectionEyebrow: "The perfume wardrobe",
    sectionAccent: "Perfumes",
  },
  "perfume-oils": {
    image: "/assets/home/collection-for-him.jpg",
    eyebrow: "Swiss Arabian",
    title: "Perfume Oils",
    subtitle: "Concentrated oriental oils",
    sectionEyebrow: "Rich & lasting",
    sectionAccent: "Oils",
  },
  incense: {
    image: "/assets/home/gender-unisex.png",
    eyebrow: "Swiss Arabian",
    title: "Incense",
    subtitle: "Oud muattar & home ritual",
    sectionEyebrow: "For the home",
    sectionAccent: "Incense",
  },
};

/** Slugs that temporarily fall back to the full product catalog. */
export const COLLECTION_PRODUCT_FALLBACK_SLUGS = new Set([
  "minis",
  "bundles",
]);

export function getCollectionHeroConfig(
  slug: string,
  collectionName?: string | null,
): CollectionHeroConfig {
  const preset = BY_SLUG[slug];
  if (preset) return preset;

  const title =
    collectionName?.trim() ||
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  return {
    ...DEFAULT_HERO,
    title,
    sectionAccent: title,
  };
}
