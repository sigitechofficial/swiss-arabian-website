export const MAIN_NAV = [
  { label: "Minis", href: "/collections/minis" },
  { label: "New Launches", href: "/collections/new-launches" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Perfumes", href: "/collections/perfume" },
  { label: "Perfume Oils", href: "/collections/concentrated-perfume-oils" },
  { label: "Incense", href: "/collections/incense" },
  { label: "Gift Sets", href: "/collections/gift-sets" },
  { label: "Subscription", href: "/subscriptions" },
] as const;

export type MobileNavLink = { label: string; href: string };
export type MobileNavGroup = {
  label: string;
  href?: string;
  children: Array<MobileNavLink | { label: string; kind: "heading" }>;
};
export type MobileNavItem =
  | ({ type: "link" } & MobileNavLink)
  | ({ type: "group" } & MobileNavGroup);

export const MOBILE_NAV: MobileNavItem[] = [
  { type: "link", label: "Minis", href: "/collections/minis" },
  { type: "link", label: "New Launches", href: "/collections/new-launches" },
  { type: "link", label: "Best Sellers", href: "/collections/best-sellers" },
  { type: "link", label: "Perfumes", href: "/collections/perfume" },
  { type: "link", label: "Perfume Oils", href: "/collections/concentrated-perfume-oils" },
  { type: "link", label: "Incense", href: "/collections/incense" },
  { type: "link", label: "Gift Sets", href: "/collections/gift-sets" },
  { type: "link", label: "Subscription", href: "/subscriptions" },
];

const home = "/assets/home" as const;

/** Home hero carousel — desktop 3840×1000; mobile uses portrait creatives */
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

/** Portrait banners — mobile carousel only */
export const HERO_SLIDES_MOBILE = [
  {
    id: "summer-icons",
    src: `${home}/hero-mobile-summer-icons.jpg`,
    alt: "Meet the new icons of summer — Shop now. Terms and conditions apply.",
    href: "/#new-launches",
  },
  {
    id: "bundle-offers",
    src: `${home}/hero-mobile-bundle-offers.jpg`,
    alt: "Exclusive bundle offers up to 25% off — Shop now. Terms and conditions apply.",
    href: "/products",
  },
  {
    id: "shaghaf-free",
    src: `${home}/hero-mobile-shaghaf-free.jpg`,
    alt: "Get a free Shaghaf miniature on purchases of $200 and above — Shop now.",
    href: "/products",
  },
  {
    id: "gift-sets",
    src: `${home}/hero-mobile-gift-sets.jpg`,
    alt: "Unbox happiness — elevate every occasion with a perfect gift set. Shop now.",
    href: "/gift-box",
  },
  {
    id: "summer-essentials",
    src: `${home}/hero-mobile-summer-essentials.jpg`,
    alt: "Summer essentials — get a free Shaghaf miniature on purchases of $200 and above. Shop now.",
    href: "/products",
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
    panel: `${home}/shaghaf-nectar-blush.jpg`,
    oudTonka: `${home}/shaghaf-oud-tonka.png`,
    oudAhmar: `${home}/shaghaf-oud-ahmar.png`,
    amberInfusion: `${home}/shaghaf-amber-infusion.png`,
    oudAzraq: `${home}/shaghaf-oud-azraq.png`,
    oudAswad: `${home}/shaghaf-oud-aswad.png`,
  },
} as const;
