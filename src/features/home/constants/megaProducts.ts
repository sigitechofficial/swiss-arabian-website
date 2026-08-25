export type MegaProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string;
  notes?: string;
};

/** Fixed picks per mega menu (keyed by ChromeMega.id) — fully static
 *  dummy data with local images, no live catalog call at all. Update by
 *  hand (or wire back to the catalog API later) when real data is ready. */
export const MEGA_PRODUCTS: Record<string, MegaProduct[]> = {
  perfumes: [
    {
      id: "rose-01",
      name: "Rose 01",
      slug: "rose-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/rose-01-cutout.png",
      notes: "Rose · Musk · Amber",
    },
    {
      id: "vanilla-01",
      name: "Vanilla 01",
      slug: "vanilla-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/vanilla-01-cutout.png",
      notes: "Vanilla · Amber · Musk",
    },
    {
      id: "patchouli-01",
      name: "Patchouli 01",
      slug: "patchouli-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/patchouli-01-cutout.png",
      notes: "Patchouli · Wood · Amber",
    },
    {
      id: "tobacco-01",
      name: "Tobacco 01",
      slug: "tobacco-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/tobacco-01-cutout.png",
      notes: "Tobacco · Wood · Vanilla",
    },
  ],
  oils: [
    {
      id: "shaghaf-oud-ahmar",
      name: "Shaghaf Oud Ahmar",
      slug: "shaghaf-oud-ahmar",
      price: 240,
      currency: "AED",
      image: "/assets/products/shaghaf-oud-ahmar-cutout.png",
      notes: "Amber · Oud · Spice",
    },
    {
      id: "shaghaf-oud-tonka",
      name: "Shaghaf Oud Tonka",
      slug: "shaghaf-oud-tonka",
      price: 240,
      currency: "AED",
      image: "/assets/products/shaghaf-oud-tonka-cutout.png",
      notes: "Oud · Tonka Bean · Musk",
    },
    {
      id: "shaghaf-oud-azraq",
      name: "Shaghaf Oud Azraq",
      slug: "shaghaf-oud-azraq",
      price: 240,
      currency: "AED",
      image: "/assets/products/shaghaf-oud-azraq-cutout.png",
      notes: "Oud · Saffron · Musk",
    },
    {
      id: "shaghaf-oud-elixir",
      name: "Shaghaf Oud Elixir",
      slug: "shaghaf-oud-elixir",
      price: 260,
      currency: "AED",
      image: "/assets/products/shaghaf-oud-elixir-cutout.png",
      notes: "Saffron · Rose · Oud",
    },
  ],
  incense: [
    {
      id: "incense-01",
      name: "Incense 01",
      slug: "incense-01",
      price: 230,
      currency: "AED",
      image: "/assets/products/incense-01-cutout.png",
      notes: "Oud · Amber · Musk",
    },
    {
      id: "shaghaf-oud-aswad",
      name: "Shaghaf Oud Aswad",
      slug: "shaghaf-oud-aswad",
      price: 260,
      currency: "AED",
      image: "/assets/products/shaghaf-oud-aswad-cutout.png",
      notes: "Oud · Leather · Spice",
    },
    {
      id: "shaghaf-nectar-blush",
      name: "Shaghaf Nectar Blush",
      slug: "shaghaf-nectar-blush",
      price: 240,
      currency: "AED",
      image: "/assets/products/shaghaf-nectar-blush-cutout.png",
      notes: "Nectar · Rose · Musk",
    },
    {
      id: "rose-01-incense",
      name: "Rose 01",
      slug: "rose-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/rose-01-cutout.png",
      notes: "Rose · Musk · Amber",
    },
  ],
  best: [
    {
      id: "tobacco-01-best",
      name: "Tobacco 01",
      slug: "tobacco-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/tobacco-01-cutout.png",
      notes: "Tobacco · Wood · Vanilla",
    },
    {
      id: "incense-01-best",
      name: "Incense 01",
      slug: "incense-01",
      price: 230,
      currency: "AED",
      image: "/assets/products/incense-01-cutout.png",
      notes: "Oud · Amber · Musk",
    },
    {
      id: "rose-01-best",
      name: "Rose 01",
      slug: "rose-01",
      price: 149,
      currency: "AED",
      image: "/assets/products/rose-01-cutout.png",
      notes: "Rose · Musk · Amber",
    },
    {
      id: "shaghaf-oud-ahmar-best",
      name: "Shaghaf Oud Ahmar",
      slug: "shaghaf-oud-ahmar",
      price: 240,
      currency: "AED",
      image: "/assets/products/shaghaf-oud-ahmar-cutout.png",
      notes: "Amber · Oud · Spice",
    },
  ],
};
