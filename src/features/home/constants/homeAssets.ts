/** Flat desktop labels (legacy) — prefer MOBILE_NAV / DesktopNav for hierarchy */
export const MAIN_NAV = [
  { label: "Minis", href: "/products" },
  { label: "Bundles", href: "/products" },
  { label: "New Launches", href: "/#new-launches" },
  { label: "Best Sellers", href: "/#best-sellers" },
  { label: "Perfumes", href: "/products" },
  { label: "Perfume Oils", href: "/products" },
  { label: "Incense", href: "/products" },
  { label: "Gift Sets", href: "/gift-box" },
  { label: "Subscription", href: "/subscriptions" },
] as const;

export type MobileNavLink = { label: string; href: string };
export type MobileNavGroup = {
  label: string;
  children: Array<MobileNavLink | { label: string; kind: "heading" }>;
};
export type MobileNavItem =
  | ({ type: "link" } & MobileNavLink)
  | ({ type: "group" } & MobileNavGroup);

/** Full-page mobile menu — matches prototype nav sheet */
export const MOBILE_NAV: MobileNavItem[] = [
  { type: "link", label: "Minis", href: "/products" },
  { type: "link", label: "Bundles", href: "/products" },
  { type: "link", label: "New Launches", href: "/#new-launches" },
  {
    type: "group",
    label: "Best Sellers",
    children: [
      { label: "Trending", href: "/#best-sellers" },
      { label: "Perfume Best Sellers", href: "/#best-sellers" },
      { label: "Perfume Oil Best Sellers", href: "/#best-sellers" },
      { label: "Incense Best Sellers", href: "/#best-sellers" },
    ],
  },
  {
    type: "group",
    label: "Perfumes",
    children: [
      { label: "Type", kind: "heading" },
      { label: "Men", href: "/products?gender=men" },
      { label: "Women", href: "/products?gender=women" },
      { label: "Unisex", href: "/products?gender=unisex" },
      { label: "Collections", kind: "heading" },
      { label: "Cities", href: "/collections" },
      { label: "Heritage", href: "/collections" },
      { label: "Shaghaf", href: "/collections/shaghaf" },
      { label: "Love", href: "/collections" },
      { label: "Wild", href: "/collections" },
      { label: "Harmony", href: "/collections" },
      { label: "Sawalef", href: "/collections" },
      { label: "Hair Mist", href: "/collections" },
    ],
  },
  {
    type: "group",
    label: "Perfume Oils",
    children: [
      { label: "Concentrated Perfume Oils", href: "/products" },
      { label: "Dehn El Oud", href: "/products" },
      { label: "Malaki", href: "/products" },
      { label: "Private", href: "/products" },
    ],
  },
  {
    type: "group",
    label: "Incense",
    children: [{ label: "Oud Muattar", href: "/products" }],
  },
  { type: "link", label: "Gift Sets", href: "/gift-box" },
  { type: "link", label: "Subscription", href: "/subscriptions" },
];

const home = "/assets/home" as const;

export const homeAssets = {
  logo: `${home}/swiss-arabian-logo.png`,
  hero: `${home}/hero-scents-of-summer.jpg`,
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
