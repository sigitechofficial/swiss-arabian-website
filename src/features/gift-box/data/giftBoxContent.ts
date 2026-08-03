import { homeAssets } from "@/features/home/constants/homeAssets";
import type { HomeProduct } from "@/features/home/types/home";

const p = homeAssets.products;

/** Offers & Gift Sets grid — Figma 293:1881 (NEW badges) */
export const giftSetOffers: HomeProduct[] = [
  {
    id: "gs-patchouli-01",
    name: "Patchouli 01",
    family: "Woody · Earthy",
    price: 68,
    image: p.patchouli01,
    slug: "patchouli-01",
    badge: "new",
  },
  {
    id: "gs-incense-01",
    name: "Incense 01",
    family: "Frankincense · Oud",
    price: 68,
    image: p.incense01,
    slug: "incense-01",
    badge: "new",
  },
  {
    id: "gs-tobacco-01",
    name: "Tobacco 01",
    family: "Tobacco · Honey · Spice",
    price: 68,
    image: p.tobacco01,
    slug: "tobacco-01",
    badge: "new",
  },
  {
    id: "gs-shaghaf-vanilla-toffee",
    name: "Shaghaf Vanilla Toffee",
    family: "Vanilla · Caramel",
    price: 66,
    image: p.shaghafVanillaToffee,
    slug: "shaghaf-vanilla-toffee",
    badge: "new",
  },
  {
    id: "gs-shaghaf-oud-tonka",
    name: "Shaghaf Oud Tonka",
    family: "Oud · Tonka",
    price: 66,
    image: p.shaghafOudTonka,
    slug: "shaghaf-oud-tonka",
    badge: "new",
  },
  {
    id: "gs-rose-01",
    name: "Rose 01",
    family: "Taif Rose · Lychee · Musk",
    price: 68,
    image: p.rose01,
    slug: "rose-01",
    badge: "new",
  },
  {
    id: "gs-vanilla-01",
    name: "Vanilla 01",
    family: "Vanilla · Tonka · Amber",
    price: 68,
    image: p.vanilla01,
    slug: "vanilla-01",
    badge: "new",
  },
  {
    id: "gs-casablanca",
    name: "Casablanca",
    family: "Oriental · Floral",
    price: 55,
    image: p.casablanca,
    slug: "casablanca",
    badge: "new",
  },
];

/** Popular Products rail — Figma (no NEW badge) */
export const giftSetPopular: HomeProduct[] = [
  {
    id: "gs-pop-oud-ahmar",
    name: "Shaghaf Oud Ahmar",
    family: "Amber · Oud · Spice",
    price: 66,
    image: p.shaghafOudAhmar,
    slug: "shaghaf-oud-ahmar",
  },
  {
    id: "gs-pop-vanilla-01",
    name: "Vanilla 01",
    family: "Vanilla · Tonka · Amber",
    price: 68,
    image: p.vanilla01,
    slug: "vanilla-01",
  },
  {
    id: "gs-pop-rose-01",
    name: "Rose 01",
    family: "Taif Rose · Lychee · Musk",
    price: 68,
    image: p.rose01,
    slug: "rose-01",
  },
  {
    id: "gs-pop-casablanca",
    name: "Casablanca",
    family: "Oriental · Floral",
    price: 55,
    image: p.casablanca,
    slug: "casablanca",
  },
];

/** Popular Fragrances tags — Figma 294:186 */
export const fragranceTags = [
  "Aldehyde",
  "Amber",
  "Aromatic",
  "Chypre",
  "Citrus",
  "Floral",
  "Fougere",
  "Fruity",
  "Gourmand",
  "Herbaceous",
  "Leather",
  "Musk",
  "Oriental",
  "Oudy",
  "Spicy",
  "Sweet",
  "Vanilla",
  "Woody",
] as const;

export const giftSetsDisclaimer =
  "These creations of perfumes and oils are impressions and versions of well-known brand fragrances, and are not associated in any way with the designer brands or manufacturers named. All trademarks and copyrights remain the property of their respective owners and designers.";
