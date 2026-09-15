import { STATIC_PRODUCTS } from "@/features/home/constants/staticProducts";
import type { ProductSummary } from "../types/product";

/** Static filter/sort metadata layered on top of `STATIC_PRODUCTS` for the
 *  "all products" / collection catalog page — everything here is
 *  hand-authored (no live catalog attributes exist yet), matching the
 *  `v5/products.html` design-variant reference: concentration, house
 *  collection, featured note, and a rating/sales pair used only for the
 *  "Customer Ratings" / "Best Selling" sort options. */
export type Concentration = "extrait" | "edp";

export type CatalogProduct = ProductSummary & {
  concentration: Concentration | null;
  collection: string;
  note: string;
  rating: number;
  sales: number;
};

type CatalogMeta = {
  concentration: Concentration;
  collection: string;
  note: string;
  rating: number;
  sales: number;
};

const META: Record<string, CatalogMeta> = {
  "rose-01": { concentration: "extrait", collection: "heritage", note: "rose", rating: 4.9, sales: 1240 },
  "shaghaf-oud-ahmar": { concentration: "edp", collection: "shaghaf", note: "oud", rating: 4.8, sales: 1180 },
  "vanilla-01": { concentration: "extrait", collection: "heritage", note: "vanilla", rating: 4.8, sales: 1050 },
  "incense-01": { concentration: "extrait", collection: "heritage", note: "incense", rating: 4.6, sales: 810 },
  "shaghaf-nectar-blush": { concentration: "edp", collection: "shaghaf", note: "rose", rating: 4.3, sales: 580 },
  "patchouli-01": { concentration: "extrait", collection: "heritage", note: "patchouli", rating: 4.7, sales: 890 },
  "shaghaf-oud-aswad": { concentration: "edp", collection: "shaghaf", note: "oud", rating: 4.8, sales: 1100 },
  "tobacco-01": { concentration: "extrait", collection: "heritage", note: "tobacco", rating: 4.5, sales: 720 },
  "shaghaf-oud-tonka": { concentration: "edp", collection: "shaghaf", note: "oud", rating: 4.6, sales: 870 },
  "shaghaf-oud-azraq": { concentration: "edp", collection: "shaghaf", note: "oud", rating: 4.7, sales: 980 },
  "shaghaf-oud-elixir": { concentration: "edp", collection: "shaghaf", note: "oud", rating: 4.9, sales: 1310 },
};

export const CATALOG_PRODUCTS: CatalogProduct[] = STATIC_PRODUCTS.map((product) => {
  const meta = META[product.slug] ?? {
    concentration: "extrait" as const,
    collection: "heritage",
    note: "",
    rating: 4.5,
    sales: 500,
  };
  return { ...product, ...meta };
});

export const CONCENTRATION_LABELS: Record<Concentration, string> = {
  extrait: "Extrait de Parfum",
  edp: "Eau de Parfum",
};

export const COLLECTION_LABELS: Record<string, string> = {
  heritage: "Heritage",
  shaghaf: "Shaghaf",
};

export const NOTE_LABELS: Record<string, string> = {
  oud: "Oud",
  rose: "Rose",
  vanilla: "Vanilla",
  patchouli: "Patchouli",
  tobacco: "Tobacco",
  incense: "Incense",
};

export type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "bestselling";

export function sortCatalogProducts(
  products: CatalogProduct[],
  sort: SortOption,
): CatalogProduct[] {
  const sorted = [...products];
  switch (sort) {
    case "newest":
      return sorted.reverse();
    case "price-asc":
      return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price-desc":
      return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "bestselling":
      return sorted.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0));
    case "featured":
    default:
      return sorted;
  }
}
