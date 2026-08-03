import { trendingProducts } from "@/features/home/data/homeContent";
import type { HomeProduct } from "@/features/home/types/home";

const pdp = "/assets/pdp" as const;

export const pdpAssets = {
  hero: `${pdp}/hero-shaghaf-vanilla-toffee.png`,
  gallery: [
    `${pdp}/hero-shaghaf-vanilla-toffee.png`,
    `${pdp}/gallery-01.jpg`,
    `${pdp}/gallery-02.jpg`,
    `${pdp}/gallery-03.jpg`,
  ],
  truck: `${pdp}/icon-truck.svg`,
  shield: `${pdp}/icon-shield.svg`,
  gift: `${pdp}/icon-gift.svg`,
} as const;

/** Design-system fallback for the Figma PDP showcase (475:7005). */
export const PDP_SHOWCASE = {
  collection: "Swiss Arabian · Shaghaf Collection",
  title: "Shaghaf Vanilla Toffee",
  price: 66,
  currencySymbol: "$",
  badge: "New" as const,
  notes: ["Gourmand", "Vanilla", "Caramel", "Amber", "Sweet Toffee"],
  description:
    "An exquisite, mouth-watering blend designed to wrap you in a golden aura of rich caramel, melted toffee, and premium Madagascar vanilla. This sophisticated Gourmand masterpiece strikes a perfect duality between classic Western luxury and Oriental soul, delivering unmatched longevity.",
  sizeLabel: "75ml / 2.5 fl. oz",
  sizeOption: "75ml (In Stock)",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Perfumes", href: "/products" },
    { label: "Shaghaf Collection", href: "/collections/shaghaf" },
    { label: "Shaghaf Vanilla Toffee", href: "/products/shaghaf-vanilla-toffee" },
  ],
  trust: [
    { icon: pdpAssets.truck, label: "Free US Shipping" },
    { icon: pdpAssets.shield, label: "100% Authentic Product" },
    { icon: pdpAssets.gift, label: "Samples included" },
  ],
} as const;

/** Recommendation shelf — same ProductCard as landing Trending */
export function getPdpRecommendations(excludeSlug?: string): HomeProduct[] {
  return trendingProducts
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, 4);
}
