/** Static per-product detail-page copy — mirrors `v5/detail.html`'s
 *  "composition" tabs (Story / Notes / Details / How to wear / Shipping /
 *  Authenticity). Hand-authored against each product's existing
 *  `CATALOG_PRODUCTS` metadata (title, subtitle, concentration, collection)
 *  since there's no live PDP content API yet. */

export type NoteRow = {
  level: "Top" | "Heart" | "Base";
  names: string;
  bar: number; // 0-100, decorative "longevity" bar length
};

export type ProductReview = {
  name: string;
  body: string;
  rating?: number;
};

export type ProductDetailContent = {
  story: string;
  notes: NoteRow[];
  wear: string;
  shipping: string;
  authenticity: string;
};


/** Decorative dot colour per note word, used on the hero's note chips —
 *  purely visual grouping (warm florals vs. woods vs. resins), not a real
 *  scent-family taxonomy. */
const NOTE_DOT_COLORS: Record<string, string> = {
  rose: "#d4576f",
  musk: "#c9b79a",
  amber: "#e0bd78",
  oud: "#6b4a2f",
  spice: "#c1642c",
  vanilla: "#e8c988",
  wood: "#8a6b4a",
  patchouli: "#6f5b3e",
  tobacco: "#8a5a34",
  leather: "#5c4033",
  saffron: "#e2a63b",
  nectar: "#e08a5b",
  incense: "#a98a5c",
  wide: "#8c4435",
};

export function noteDotColor(word: string): string {
  return NOTE_DOT_COLORS[word.trim().toLowerCase()] ?? "#8c4435";
}
