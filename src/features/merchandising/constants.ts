export const MERCH_RAIL_SLUGS = {
  pdpAlsoLike: "you-may-also-like",
  cartLayer: "layer-your-scents",
  checkoutDontMiss: "dont-miss-this",
} as const;

export const MERCH_RAIL_SLUG_SET = new Set<string>(Object.values(MERCH_RAIL_SLUGS));
