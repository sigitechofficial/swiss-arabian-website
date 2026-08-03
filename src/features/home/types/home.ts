export type HomeProductBadge = "new" | "trending" | null;

export type HomeProduct = {
  id: string;
  name: string;
  family: string;
  price: number;
  image: string;
  slug: string;
  badge?: HomeProductBadge;
};

export type ShaghafSpotlightItem = {
  id: string;
  name: string;
  family: string;
  price: number;
  image: string;
  slug: string;
};

export type HomeReview = {
  id: string;
  quote: string;
  name: string;
  initial: string;
  meta: string;
};
