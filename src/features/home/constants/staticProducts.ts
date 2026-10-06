import type { ProductSummary } from "@/features/catalog/types/product";

/** Hand-picked bottles for the bundle panel, and the fallback when a homepage
 *  collection strip has nothing to show. Mirrors the cutouts in `megaProducts.ts`.
 *
 *  Every product's `imageUrls[1]` is its ingredients hover shot. The best-sellers
 *  and trending strips only use that hover while they are showing this fallback. */
export const STATIC_PRODUCTS: ProductSummary[] = [
  {
    id: "rose-01",
    slug: "rose-01",
    title: "Rose 01",
    subtitle: "Rose · Musk · Amber",
    price: 149,
    currency: "AED",
    imageUrl: "/assets/products/rose-01-cutout.png",
    imageUrls: [
      "/assets/products/rose-01-cutout.png",
      "/assets/products/rose-01-ingredients.png",
    ],
  },
  {
    id: "shaghaf-oud-ahmar",
    slug: "shaghaf-oud-ahmar",
    title: "Shaghaf Oud Ahmar",
    subtitle: "Amber · Oud · Spice",
    price: 240,
    currency: "AED",
    imageUrl: "/assets/products/shaghaf-oud-ahmar-cutout.png",
    imageUrls: [
      "/assets/products/shaghaf-oud-ahmar-cutout.png",
      "/assets/products/shaghaf-oud-ahmar-ingredients.png",
    ],
  },
  {
    id: "vanilla-01",
    slug: "vanilla-01",
    title: "Vanilla 01",
    subtitle: "Vanilla · Amber · Musk",
    price: 149,
    currency: "AED",
    imageUrl: "/assets/products/vanilla-01-cutout.png",
    imageUrls: [
      "/assets/products/vanilla-01-cutout.png",
      "/assets/products/vanilla-01-ingredients.png",
    ],
  },
  {
    id: "incense-01",
    slug: "incense-01",
    title: "Incense 01",
    subtitle: "Oud · Amber · Musk",
    price: 230,
    currency: "AED",
    imageUrl: "/assets/products/incense-01-cutout.png",
    imageUrls: [
      "/assets/products/incense-01-cutout.png",
      "/assets/products/incense-01-ingredients.png",
    ],
  },
  {
    id: "shaghaf-nectar-blush",
    slug: "shaghaf-nectar-blush",
    title: "Shaghaf Nectar Blush",
    subtitle: "Nectar · Rose · Musk",
    price: 240,
    currency: "AED",
    imageUrl: "/assets/products/shaghaf-nectar-blush-cutout.png",
    imageUrls: [
      "/assets/products/shaghaf-nectar-blush-cutout.png",
      "/assets/products/shaghaf-nectar-blush-ingredients.png",
    ],
  },
  {
    id: "patchouli-01",
    slug: "patchouli-01",
    title: "Patchouli 01",
    subtitle: "Patchouli · Wood · Amber",
    price: 149,
    currency: "AED",
    imageUrl: "/assets/products/patchouli-01-cutout.png",
    imageUrls: [
      "/assets/products/patchouli-01-cutout.png",
      "/assets/products/patchouli-01-ingredients.png",
    ],
  },
  {
    id: "shaghaf-oud-aswad",
    slug: "shaghaf-oud-aswad",
    title: "Shaghaf Oud Aswad",
    subtitle: "Oud · Leather · Spice",
    price: 260,
    currency: "AED",
    imageUrl: "/assets/products/shaghaf-oud-aswad-cutout.png",
    imageUrls: [
      "/assets/products/shaghaf-oud-aswad-cutout.png",
      "/assets/products/shaghaf-oud-aswad-ingredients.png",
    ],
  },
  {
    id: "tobacco-01",
    slug: "tobacco-01",
    title: "Tobacco 01",
    subtitle: "Tobacco · Wood · Vanilla",
    price: 149,
    currency: "AED",
    imageUrl: "/assets/products/tobacco-01-cutout.png",
    imageUrls: [
      "/assets/products/tobacco-01-cutout.png",
      "/assets/products/tobacco-01-ingredients.png",
    ],
  },
  {
    id: "shaghaf-oud-tonka",
    slug: "shaghaf-oud-tonka",
    title: "Shaghaf Oud Tonka",
    subtitle: "Oud · Tonka Bean · Musk",
    price: 240,
    currency: "AED",
    imageUrl: "/assets/products/shaghaf-oud-tonka-cutout.png",
    imageUrls: [
      "/assets/products/shaghaf-oud-tonka-cutout.png",
      "/assets/products/shaghaf-oud-tonka-ingredients.png",
    ],
  },
  {
    id: "shaghaf-oud-azraq",
    slug: "shaghaf-oud-azraq",
    title: "Shaghaf Oud Azraq",
    subtitle: "Oud · Saffron · Musk",
    price: 240,
    currency: "AED",
    imageUrl: "/assets/products/shaghaf-oud-azraq-cutout.png",
    imageUrls: [
      "/assets/products/shaghaf-oud-azraq-cutout.png",
      "/assets/products/shaghaf-oud-azraq-ingredients.png",
    ],
  },
  {
    id: "shaghaf-oud-elixir",
    slug: "shaghaf-oud-elixir",
    title: "Shaghaf Oud Elixir",
    subtitle: "Saffron · Rose · Oud",
    price: 260,
    currency: "AED",
    imageUrl: "/assets/products/shaghaf-oud-elixir-cutout.png",
    imageUrls: [
      "/assets/products/shaghaf-oud-elixir-cutout.png",
      "/assets/products/shaghaf-oud-elixir-ingredients.png",
    ],
  },
];
