/**
 * Storefront nav — every shop entry is a catalog collection route:
 * `/collections/{slug}` → GET /storefront/catalog/collections/:slug[/products]
 */

/** Flat desktop labels (legacy) — prefer MOBILE_NAV / DesktopNav for hierarchy */
export const MAIN_NAV = [
  { label: "Minis", href: "/collections/minis" },
  { label: "Bundles", href: "/products" },
  { label: "New Launches", href: "/collections/new-launches" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Perfumes", href: "/collections/perfumes" },
  { label: "Perfume Oils", href: "/collections/perfume-oils" },
  { label: "Incense", href: "/collections/incense" },
  { label: "Gift Sets", href: "/gift-box" },
  { label: "Subscription", href: "/subscriptions" },
] as const;

export type MobileNavLink = { label: string; href: string };
export type MobileNavGroup = {
  label: string;
  /** Parent collection when the group label itself is a link */
  href?: string;
  children: Array<MobileNavLink | { label: string; kind: "heading" }>;
};
export type MobileNavItem =
  | ({ type: "link" } & MobileNavLink)
  | ({ type: "group" } & MobileNavGroup);

/** Full-page mobile menu + desktop nav — all shop paths are collections */
export const MOBILE_NAV: MobileNavItem[] = [
  { type: "link", label: "Minis", href: "/collections/minis" },
  { type: "link", label: "Bundles", href: "/products" },
  { type: "link", label: "New Launches", href: "/collections/new-launches" },
  {
    type: "group",
    label: "Best Sellers",
    href: "/collections/best-sellers",
    children: [
      { label: "Trending", href: "/collections/trending" },
      { label: "Perfume Best Sellers", href: "/collections/perfume-best-sellers" },
      {
        label: "Perfume Oil Best Sellers",
        href: "/collections/perfume-oil-best-sellers",
      },
      { label: "Incense Best Sellers", href: "/collections/incense-best-sellers" },
    ],
  },
  {
    type: "group",
    label: "Perfumes",
    href: "/collections/perfumes",
    children: [
      { label: "Type", kind: "heading" },
      { label: "Men", href: "/collections/men" },
      { label: "Women", href: "/collections/women" },
      { label: "Unisex", href: "/collections/unisex" },
      { label: "Collections", kind: "heading" },
      { label: "Cities", href: "/collections/cities" },
      { label: "Heritage", href: "/collections/heritage-collection" },
      { label: "Shaghaf", href: "/collections/shaghaf" },
      { label: "Love", href: "/collections/love" },
      { label: "Wild", href: "/collections/wild" },
      { label: "Harmony", href: "/collections/harmony" },
      { label: "Sawalef", href: "/collections/sawalef" },
      { label: "Hair Mist", href: "/collections/hair-mist" },
    ],
  },
  {
    type: "group",
    label: "Perfume Oils",
    href: "/collections/perfume-oils",
    children: [
      {
        label: "Concentrated Perfume Oils",
        href: "/collections/concentrated-perfume-oils",
      },
      { label: "Dehn El Oud", href: "/collections/dehn-el-oud" },
      { label: "Malaki", href: "/collections/malaki" },
      { label: "Private", href: "/collections/private" },
    ],
  },
  {
    type: "group",
    label: "Incense",
    href: "/collections/incense",
    children: [{ label: "Oud Muattar", href: "/collections/oud-muattar" }],
  },
  { type: "link", label: "Gift Sets", href: "/gift-box" },
  { type: "link", label: "Subscription", href: "/subscriptions" },
];

const home = "/assets/home" as const;

/** Home hero carousel — baked-in creative banners at 3840×1000 */
export const HERO_SLIDE_MS = 6000;

export const HERO_SLIDES = [
  {
    id: "scents-of-summer",
    src: `${home}/hero-scents-of-summer.jpg`,
    alt: "Scents of Summer — Shop now. Terms and conditions apply.",
    href: "/#new-launches",
  },
  {
    id: "summer-icons",
    src: `${home}/hero-summer-icons.jpg`,
    alt: "Meet the new icons of summer — Shop now. Terms and conditions apply.",
    href: "/#new-launches",
  },
  {
    id: "welcome10",
    src: `${home}/hero-welcome10.jpg`,
    alt: "Enjoy 10% off your first purchase with code WELCOME10 — Shop now.",
    href: "/products",
  },
  {
    id: "bundle-offers",
    src: `${home}/hero-bundle-offers.jpg`,
    alt: "Exclusive bundle offers up to 25% off — Shop now. Terms and conditions apply.",
    href: "/products",
  },
  {
    id: "shaghaf-free",
    src: `${home}/hero-shaghaf-free.jpg`,
    alt: "Get a free Shaghaf miniature on purchases of $200 and above — Shop now.",
    href: "/products",
  },
  {
    id: "gift-sets",
    src: `${home}/hero-gift-sets.jpg`,
    alt: "Unbox happiness — elevate every occasion with a perfect gift set. Shop now.",
    href: "/gift-box",
  },
] as const;

export const homeAssets = {
  logo: `${home}/swiss-arabian-logo.png`,
  hero: `${home}/hero-scents-of-summer.jpg`,
  heroes: HERO_SLIDES.map((slide) => slide.src),
  search: `${home}/icon-search.svg`,
  searchHandle: `${home}/icon-search-handle.svg`,
  truck: `${home}/icon-truck.svg`,
  truckWheel: `${home}/icon-truck-wheel.svg`,
  userHead: `${home}/icon-user-head.svg`,
  userBody: `${home}/icon-user-body.svg`,
  pin: `${home}/icon-pin.svg`,
  pinDot: `${home}/icon-pin-dot.svg`,
  theme: `${home}/icon-theme.svg`,
  cart: `${home}/icon-cart.svg`,
  cartWheel: `${home}/icon-cart-wheel.svg`,
  why: {
    crafted: `${home}/why-crafted-uae.png`,
    returns: `${home}/why-free-returns.png`,
    bottles: `${home}/why-bottles-sold.png`,
    reviews: `${home}/why-reviews.png`,
  },
  gender: {
    women: `${home}/gender-women.png`,
    men: `${home}/gender-men.jpg`,
    unisex: `${home}/gender-unisex.png`,
  },
  collections: {
    forHim: `${home}/collection-for-him.jpg`,
    forHer: `${home}/collection-for-her.jpg`,
    bestSellers: `${home}/collection-best-sellers.jpg`,
    newIn: `${home}/collection-new-in.jpg`,
  },
  products: {
    patchouli01: `${home}/product-patchouli-01.png`,
    patchouli01Alt: `${home}/product-patchouli-01-alt.png`,
    incense01: `${home}/product-incense-01.png`,
    tobacco01: `${home}/product-tobacco-01.png`,
    rose01: `${home}/product-rose-01.png`,
    vanilla01: `${home}/product-vanilla-01.png`,
    casablanca: `${home}/product-casablanca.png`,
    shaghafVanillaToffee: `${home}/product-shaghaf-vanilla-toffee.png`,
    shaghafOudTonka: `${home}/product-shaghaf-oud-tonka.png`,
    shaghafOudAhmar: `${home}/product-shaghaf-oud-ahmar.png`,
  },
  shaghaf: {
    oudTonka: `${home}/shaghaf-oud-tonka.png`,
    oudAhmar: `${home}/shaghaf-oud-ahmar.png`,
    amberInfusion: `${home}/shaghaf-amber-infusion.png`,
    oudAzraq: `${home}/shaghaf-oud-azraq.png`,
    oudAswad: `${home}/shaghaf-oud-aswad.png`,
  },
} as const;
