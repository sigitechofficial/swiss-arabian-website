import type { ProductSummary } from "@/features/catalog/types/product";

/** Fully static, hand-picked product catalog used across the landing page
 *  (products band, trending grid, bundle "shop this look" panel) — no live
 *  catalog fetch, no live image URLs. Mirrors the shape the mega menu
 *  already uses in `megaProducts.ts` so the same cutout PNGs are reused
 *  everywhere. Update by hand when real catalog data is ready to swap back
 *  in via `useLandingProducts`.
 *
 *  Every product's `imageUrls[1]` is its own ingredients hover shot — same
 *  bottle, same size/position (pixel-composited from the `-cutout.png`, so
 *  the bottle never shifts on hover), staged with its own raw ingredients
 *  behind/around it, transparent background. Card hover logic
 *  (`LandingProductsBand` / `LandingTrending`) swaps to this automatically
 *  whenever `imageUrls[1]` differs from the base `imageUrl`. */
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
