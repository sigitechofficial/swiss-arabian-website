import { homeAssets } from "@/features/home/constants/homeAssets";
import type {
  HomeProduct,
  HomeReview,
  ShaghafSpotlightItem,
} from "@/features/home/types/home";

const p = homeAssets.products;
const s = homeAssets.shaghaf;

export const whyItems = [
  {
    lines: ["Crafted in", "the UAE"],
    emphasizeLast: true,
    subtitle: "heritage since 1974.",
    image: homeAssets.why.crafted,
  },
  {
    lines: ["Free", "Returns"],
    emphasizeLast: true,
    subtitle: "no questions asked.",
    image: homeAssets.why.returns,
  },
  {
    lines: ["6,000,000+", "Bottles"],
    emphasizeLast: false,
    boldAll: true,
    subtitle: "sold worldwide.",
    image: homeAssets.why.bottles,
  },
  {
    lines: ["100,000+", "Reviews"],
    emphasizeLast: false,
    boldAll: true,
    subtitle: "loved worldwide.",
    image: homeAssets.why.reviews,
  },
] as const;

export const genderTiles = [
  {
    label: "WOMEN",
    href: "/products?gender=women",
    image: homeAssets.gender.women,
    alt: "Woman holding a perfume bottle",
  },
  {
    label: "MEN",
    href: "/products?gender=men",
    image: homeAssets.gender.men,
    alt: "Man holding a perfume bottle",
  },
  {
    label: "UNISEX",
    href: "/products?gender=unisex",
    image: homeAssets.gender.unisex,
    alt: "Person holding a perfume bottle",
  },
] as const;

export const newLaunches: HomeProduct[] = [
  {
    id: "patchouli-01",
    name: "Patchouli 01",
    family: "Woody · Earthy",
    price: 68,
    image: p.patchouli01,
    slug: "patchouli-01",
    badge: "new",
  },
  {
    id: "incense-01",
    name: "Incense 01",
    family: "Frankincense · Oud",
    price: 68,
    image: p.incense01,
    slug: "incense-01",
    badge: "new",
  },
  {
    id: "tobacco-01",
    name: "Tobacco 01",
    family: "Tobacco · Honey · Spice",
    price: 68,
    image: p.tobacco01,
    slug: "tobacco-01",
    badge: "new",
  },
  {
    id: "shaghaf-vanilla-toffee",
    name: "Shaghaf Vanilla Toffee",
    family: "Vanilla · Caramel",
    price: 66,
    image: p.shaghafVanillaToffee,
    slug: "shaghaf-vanilla-toffee",
    badge: "new",
  },
  {
    id: "shaghaf-oud-tonka",
    name: "Shaghaf Oud Tonka",
    family: "Oud · Tonka",
    price: 66,
    image: p.shaghafOudTonka,
    slug: "shaghaf-oud-tonka",
    badge: "new",
  },
  {
    id: "rose-01",
    name: "Rose 01",
    family: "Taif Rose · Lychee · Musk",
    price: 68,
    image: p.rose01,
    slug: "rose-01",
    badge: "new",
  },
  {
    id: "vanilla-01",
    name: "Vanilla 01",
    family: "Vanilla · Tonka · Amber",
    price: 68,
    image: p.vanilla01,
    slug: "vanilla-01",
    badge: "new",
  },
  {
    id: "casablanca",
    name: "Casablanca",
    family: "Oriental · Floral",
    price: 55,
    image: p.casablanca,
    slug: "casablanca",
    badge: "new",
  },
];

export const bestSellerFeatured: HomeProduct = {
  id: "shaghaf-oud-ahmar-featured",
  name: "Shaghaf Oud Ahmar",
  family: "Amber · Oud · Spice",
  price: 66,
  image: p.shaghafOudAhmar,
  slug: "shaghaf-oud-ahmar",
};

export const bestSellers: HomeProduct[] = [
  {
    id: "bs-vanilla-01",
    name: "Vanilla 01",
    family: "Vanilla · Tonka · Amber",
    price: 68,
    image: p.vanilla01,
    slug: "vanilla-01",
  },
  {
    id: "bs-rose-01",
    name: "Rose 01",
    family: "Taif Rose · Lychee · Musk",
    price: 68,
    image: p.rose01,
    slug: "rose-01",
  },
  {
    id: "bs-incense-01",
    name: "Incense 01",
    family: "Frankincense · Oud",
    price: 68,
    image: p.incense01,
    slug: "incense-01",
  },
  {
    id: "bs-shaghaf-vanilla-toffee",
    name: "Shaghaf Vanilla Toffee",
    family: "Vanilla · Caramel",
    price: 66,
    image: p.shaghafVanillaToffee,
    slug: "shaghaf-vanilla-toffee",
  },
  {
    id: "bs-tobacco-01",
    name: "Tobacco 01",
    family: "Tobacco · Honey · Spice",
    price: 68,
    image: p.tobacco01,
    slug: "tobacco-01",
  },
  {
    id: "bs-shaghaf-oud-tonka",
    name: "Shaghaf Oud Tonka",
    family: "Oud · Tonka",
    price: 66,
    image: p.shaghafOudTonka,
    slug: "shaghaf-oud-tonka",
  },
  {
    id: "bs-casablanca",
    name: "Casablanca",
    family: "Oriental · Floral",
    price: 55,
    image: p.casablanca,
    slug: "casablanca",
  },
  {
    id: "bs-patchouli-01",
    name: "Patchouli 01",
    family: "Woody · Earthy",
    price: 68,
    image: p.patchouli01Alt,
    slug: "patchouli-01",
  },
];

export const trendingProducts: HomeProduct[] = [
  {
    id: "tr-shaghaf-oud-ahmar",
    name: "Shaghaf Oud Ahmar",
    family: "Amber · Oud · Spice",
    price: 66,
    image: p.shaghafOudAhmar,
    slug: "shaghaf-oud-ahmar",
    badge: "trending",
  },
  {
    id: "tr-incense-01",
    name: "Incense 01",
    family: "Frankincense · Oud",
    price: 68,
    image: p.incense01,
    slug: "incense-01",
    badge: "trending",
  },
  {
    id: "tr-tobacco-01",
    name: "Tobacco 01",
    family: "Tobacco · Honey · Spice",
    price: 68,
    image: p.tobacco01,
    slug: "tobacco-01",
    badge: "trending",
  },
  {
    id: "tr-vanilla-01",
    name: "Vanilla 01",
    family: "Vanilla · Tonka · Amber",
    price: 68,
    image: p.vanilla01,
    slug: "vanilla-01",
    badge: "trending",
  },
  {
    id: "tr-rose-01",
    name: "Rose 01",
    family: "Taif Rose · Lychee · Musk",
    price: 68,
    image: p.rose01,
    slug: "rose-01",
    badge: "trending",
  },
  {
    id: "tr-shaghaf-oud-tonka",
    name: "Shaghaf Oud Tonka",
    family: "Oud · Tonka",
    price: 66,
    image: p.shaghafOudTonka,
    slug: "shaghaf-oud-tonka",
    badge: "trending",
  },
  {
    id: "tr-shaghaf-vanilla-toffee",
    name: "Shaghaf Vanilla Toffee",
    family: "Vanilla · Caramel",
    price: 66,
    image: p.shaghafVanillaToffee,
    slug: "shaghaf-vanilla-toffee",
    badge: "trending",
  },
  {
    id: "tr-casablanca",
    name: "Casablanca",
    family: "Oriental · Floral",
    price: 55,
    image: p.casablanca,
    slug: "casablanca",
    badge: "trending",
  },
];

export const shaghafSpotlight: ShaghafSpotlightItem[] = [
  {
    id: "spot-oud-tonka",
    name: "Shaghaf Oud Tonka",
    family: "Almond · tonka · vanilla",
    price: 66,
    image: s.oudTonka,
    slug: "shaghaf-oud-tonka",
  },
  {
    id: "spot-oud-ahmar",
    name: "Shaghaf Oud Ahmar",
    family: "Bergamot · amber · vanilla",
    price: 66,
    image: s.oudAhmar,
    slug: "shaghaf-oud-ahmar",
  },
  {
    id: "spot-amber-infusion",
    name: "Shaghaf Amber Infusion",
    family: "Amber · resin · warmth",
    price: 66,
    image: s.amberInfusion,
    slug: "shaghaf-amber-infusion",
  },
  {
    id: "spot-oud-azraq",
    name: "Shaghaf Oud Azraq",
    family: "Honey · oud · leather",
    price: 66,
    image: s.oudAzraq,
    slug: "shaghaf-oud-azraq",
  },
  {
    id: "spot-oud-aswad",
    name: "Shaghaf Oud Aswad",
    family: "Saffron · rose · oud",
    price: 44,
    image: s.oudAswad,
    slug: "shaghaf-oud-aswad",
  },
];

export const homeReviews: HomeReview[] = [
  {
    id: "r1",
    quote:
      '"The only brand that earns me endless compliments — every single time I wear it."',
    name: "Aisha M.",
    initial: "A",
    meta: "✓ Verified · Dubai",
  },
  {
    id: "r2",
    quote:
      '"Exceptional quality with incredible longevity — it lasts the entire day and turns heads."',
    name: "Omar K.",
    initial: "O",
    meta: "✓ Verified · Riyadh",
  },
  {
    id: "r3",
    quote:
      '"Rich, long-lasting and unmistakably mine. I get stopped and asked what I\'m wearing."',
    name: "Layla H.",
    initial: "L",
    meta: "✓ Verified · London",
  },
];

export function formatMoney(price: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

export function formatUsd(price: number) {
  return formatMoney(price, "USD");
}
