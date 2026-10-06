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

export const FALLBACK_REVIEWS: ProductReview[] = [
  {
    name: "Amira K.",
    body: "Long-wearing and beautifully balanced — I keep getting asked what I’m wearing. It feels like a signature, not a trend.",
  },
  {
    name: "Daniyal R.",
    body: "On in the morning, still there at night. Rich without being heavy, and it sits on skin rather than shouting across the room.",
  },
  {
    name: "Sara M.",
    body: "Elegant from the first spray. I’ve stopped reaching for bottles that cost three times as much — this is the one I finish.",
  },
  {
    name: "Layla H.",
    body: "Soft at first, then the oud comes through clean. I wear it to dinner and still catch it on my scarf the next day.",
  },
  {
    name: "Omar F.",
    body: "Compliment magnet without the sweetness I usually avoid. Projects for an hour, then sits close — exactly how I like it.",
  },
];

const SHARED_WEAR =
  "Apply to pulse points — wrists, the base of the throat, behind the ears. An extrait is concentrated: two touches carry through the day.";
const SHARED_SHIPPING =
  "Standard delivery in 3–7 working days across the UAE and GCC; free on orders over AED 150.00. Unopened items can be returned free within 30 days of delivery.";
const SHARED_AUTH =
  "Composed, filled and finished by Swiss Arabian in Dubai. Every bottle ships from our warehouse with its batch code intact.";

export const PRODUCT_DETAIL_CONTENT: Record<string, ProductDetailContent> = {
  "rose-01": {
    story:
      "A floral fantasy that carries you to a mythical garden. Invigorating bergamot and sweet pink pepper tempt you toward mouth-watering lychee, before majestic roses meet pink peonies in a crown of romantic flowers.",
    notes: [
      { level: "Top", names: "Lychee · Bergamot · Pink Pepper", bar: 42 },
      { level: "Heart", names: "Bulgarian Rose · Peony · Nutmeg", bar: 68 },
      { level: "Base", names: "Vanilla · Musk · Cashmere Wood", bar: 92 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "shaghaf-oud-ahmar": {
    story:
      "Shaghaf opens on a wave of saffron and warm cardamom, a spiced invitation into the house's oud heart. Amber settles underneath, carrying the burn long after the spice has faded.",
    notes: [
      { level: "Top", names: "Saffron · Cardamom · Pink Pepper", bar: 45 },
      { level: "Heart", names: "Cambodian Oud · Amber", bar: 70 },
      { level: "Base", names: "Warm Spice · Musk", bar: 94 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "vanilla-01": {
    story:
      "A gourmand comfort built slowly: bergamot and pink pepper open bright, before vanilla orchid and tonka settle in, wrapped in amber and musk for a skin-warm finish.",
    notes: [
      { level: "Top", names: "Bergamot · Pink Pepper", bar: 40 },
      { level: "Heart", names: "Vanilla Orchid · Tonka Bean", bar: 66 },
      { level: "Base", names: "Amber · White Musk", bar: 90 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "incense-01": {
    story:
      "Frankincense and bergamot rise first, smoke curling into a resinous oud and amber heart, before musk and benzoin ground the composition for hours after the ritual.",
    notes: [
      { level: "Top", names: "Frankincense · Bergamot", bar: 44 },
      { level: "Heart", names: "Oud · Amber", bar: 71 },
      { level: "Base", names: "Musk · Benzoin", bar: 93 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "shaghaf-nectar-blush": {
    story:
      "A softer Shaghaf: pink pepper and lychee open onto a nectar-rich rose heart, rounded out with musk and amber for a warm, wearable everyday blush.",
    notes: [
      { level: "Top", names: "Pink Pepper · Lychee", bar: 41 },
      { level: "Heart", names: "Rose · Nectar", bar: 65 },
      { level: "Base", names: "Musk · Amber", bar: 88 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "patchouli-01": {
    story:
      "Bergamot and pink pepper open crisp, giving way to an earthy patchouli and cedarwood heart, before amber and musk carry it into a long, woody finish.",
    notes: [
      { level: "Top", names: "Bergamot · Pink Pepper", bar: 42 },
      { level: "Heart", names: "Patchouli · Cedarwood", bar: 69 },
      { level: "Base", names: "Amber · Musk", bar: 92 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "shaghaf-oud-aswad": {
    story:
      "The darkest Shaghaf: saffron and black pepper open onto a smoky oud and leather heart, settling into a deep, spiced base built to last through the night.",
    notes: [
      { level: "Top", names: "Saffron · Black Pepper", bar: 46 },
      { level: "Heart", names: "Cambodian Oud · Leather", bar: 74 },
      { level: "Base", names: "Warm Spice · Amber", bar: 95 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "tobacco-01": {
    story:
      "Bergamot and cinnamon open onto a rich tobacco leaf and cedarwood heart, finished with vanilla and amber for a warm, honeyed close.",
    notes: [
      { level: "Top", names: "Bergamot · Cinnamon", bar: 43 },
      { level: "Heart", names: "Tobacco Leaf · Cedarwood", bar: 70 },
      { level: "Base", names: "Vanilla · Amber", bar: 91 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "shaghaf-oud-tonka": {
    story:
      "Cardamom and bergamot open bright over an oud and tonka bean heart, rounded into a soft, gourmand-leaning musk and amber base.",
    notes: [
      { level: "Top", names: "Cardamom · Bergamot", bar: 44 },
      { level: "Heart", names: "Oud · Tonka Bean", bar: 68 },
      { level: "Base", names: "Musk · Amber", bar: 90 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "shaghaf-oud-azraq": {
    story:
      "Saffron and bergamot open onto an oud and rose heart, a cooler, bluer read on the house's signature oud, settling into musk and amber.",
    notes: [
      { level: "Top", names: "Saffron · Bergamot", bar: 45 },
      { level: "Heart", names: "Oud · Rose", bar: 71 },
      { level: "Base", names: "Musk · Amber", bar: 93 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
  "shaghaf-oud-elixir": {
    story:
      "The house's richest oud: saffron and pink pepper open onto a rose and oud heart, distilled into a dense amber and musk base built for the coldest nights.",
    notes: [
      { level: "Top", names: "Saffron · Pink Pepper", bar: 48 },
      { level: "Heart", names: "Rose · Cambodian Oud", bar: 76 },
      { level: "Base", names: "Amber · Musk", bar: 96 },
    ],
    wear: SHARED_WEAR,
    shipping: SHARED_SHIPPING,
    authenticity: SHARED_AUTH,
  },
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
