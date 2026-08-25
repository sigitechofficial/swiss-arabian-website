export type ChromeLink = { label: string; href: string };

export type ChromeMega = {
  id: string;
  label: string;
  href: string;
  groups: Array<{ heading: string; links: ChromeLink[] }>;
  promo: { image: string; copy: string; cta: string; href: string; cover?: boolean };
};

export type ChromeNavItem =
  | { type: "link"; label: string; href: string; accent?: boolean }
  | ({ type: "mega" } & ChromeMega);

export const TOPBAR_CATS: ChromeLink[] = [
  { label: "Women", href: "/collections/for-her" },
  { label: "Men", href: "/collections/for-him" },
  { label: "Unisex", href: "/collections/unisex" },
];

export const PRIMARY_NAV: ChromeNavItem[] = [
  { type: "link", label: "New Launches", href: "/collections/new-launches" },
  {
    type: "mega",
    id: "perfumes",
    label: "Perfumes",
    href: "/collections/perfumes",
    groups: [
      {
        heading: "Type",
        links: [
          { label: "Men", href: "/collections/for-him" },
          { label: "Women", href: "/collections/for-her" },
          { label: "Unisex", href: "/collections/unisex" },
        ],
      },
      {
        heading: "Collections",
        links: [
          { label: "Cities", href: "/collections/cities" },
          { label: "Heritage", href: "/collections/heritage" },
          { label: "Shaghaf", href: "/collections/shaghaf" },
          { label: "Love", href: "/collections/love" },
          { label: "Wild", href: "/collections/wild" },
          { label: "Harmony", href: "/collections/harmony" },
          { label: "Sawalef", href: "/collections/sawalef" },
        ],
      },
      {
        heading: "Featured",
        links: [
          { label: "Gharaam", href: "/products" },
          { label: "Rose 01", href: "/products" },
          { label: "Shaghaf Oud", href: "/products" },
          { label: "Musk 07", href: "/products" },
          { label: "Casablanca", href: "/products" },
        ],
      },
    ],
    promo: {
      image: "/assets/collection-1.jpg",
      copy: "Extrait de parfum, composed in Dubai since 1974.",
      cta: "Shop perfumes",
      href: "/collections/perfumes",
    },
  },
  {
    type: "mega",
    id: "oils",
    label: "Perfume Oils",
    href: "/collections/perfume-oils",
    groups: [
      {
        heading: "Collections",
        links: [
          { label: "Concentrated Perfume Oils", href: "/collections/perfume-oils" },
          { label: "Dehn El Oud", href: "/collections/dehn-el-oud" },
          { label: "Malaki", href: "/collections/malaki" },
          { label: "Private", href: "/collections/private" },
          { label: "All perfume oils", href: "/collections/perfume-oils" },
        ],
      },
      {
        heading: "Popular Oils",
        links: [
          { label: "Amaani", href: "/products" },
          { label: "Rasheeqa Rouge", href: "/products" },
          { label: "Layali Noir", href: "/products" },
          { label: "Layali Blanc", href: "/products" },
        ],
      },
    ],
    promo: {
      image: "/assets/collection-2.jpg",
      copy: "Concentrated oils in the oldest tradition of the house.",
      cta: "Shop perfume oils",
      href: "/collections/perfume-oils",
    },
  },
  {
    type: "mega",
    id: "incense",
    label: "Incense",
    href: "/collections/incense",
    groups: [
      {
        heading: "Collections",
        links: [
          { label: "Oud Muattar", href: "/collections/oud-muattar" },
          { label: "Bakhoor", href: "/collections/bakhoor" },
          { label: "All incense", href: "/collections/incense" },
        ],
      },
    ],
    promo: {
      image: "/assets/collection-4.jpg",
      copy: "Oud muattar, prepared for the ritual at home.",
      cta: "Shop incense",
      href: "/collections/incense",
    },
  },
  {
    type: "mega",
    id: "best",
    label: "Best Sellers",
    href: "/collections/best-sellers",
    groups: [
      {
        heading: "Shop by",
        links: [
          { label: "Trending", href: "/products" },
          { label: "Perfume best sellers", href: "/collections/best-sellers" },
          { label: "Perfume oil best sellers", href: "/collections/perfume-oils" },
          { label: "Incense best sellers", href: "/collections/incense" },
          { label: "All best sellers", href: "/collections/best-sellers" },
        ],
      },
    ],
    promo: {
      image: "/assets/collection-1.jpg",
      copy: "The signatures our customers keep returning to.",
      cta: "Shop best sellers",
      href: "/collections/best-sellers",
      cover: true,
    },
  },
  {
    type: "mega",
    id: "collections",
    label: "Collections",
    href: "/collections",
    groups: [
      {
        heading: "Houses",
        links: [
          { label: "Cities", href: "/collections/cities" },
          { label: "Heritage", href: "/collections/heritage" },
          { label: "Shaghaf", href: "/collections/shaghaf" },
          { label: "Love", href: "/collections/love" },
          { label: "Wild", href: "/collections/wild" },
          { label: "Harmony", href: "/collections/harmony" },
        ],
      },
      {
        heading: "Shop",
        links: [
          { label: "Best Sellers", href: "/collections/best-sellers" },
          { label: "New In", href: "/collections/new-launches" },
          { label: "Gift Sets", href: "/gift-box" },
        ],
      },
    ],
    promo: {
      image: "/assets/collection-3.jpg",
      copy: "Curated houses, each with its own character.",
      cta: "Shop collections",
      href: "/collections",
      cover: true,
    },
  },
  { type: "link", label: "Minis", href: "/collections/minis" },
  { type: "link", label: "Bundles", href: "/collections/bundles" },
  { type: "link", label: "Gift Sets", href: "/gift-box", accent: true },
  { type: "link", label: "Trending", href: "/products" },
];
