export type HeroSlide = {
  id: string;
  image: string;
  alt: string;
  /** Cover focal point — bottles sit differently on each banner. */
  objectPosition: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "shaghaf-powder",
    image: "/assets/storefront/banner-shaghaf-powder.jpg",
    alt: "Shaghaf Oud Marine and St. Moritz bottles with gold and white powder clouds",
    objectPosition: "70% 62%",
  },
  {
    id: "shaghaf-splash",
    image: "/assets/storefront/banner-shaghaf-splash.jpg",
    alt: "Shaghaf Oud Marine and St. Moritz bottles in a splash of water",
    objectPosition: "55% 48%",
  },
];
