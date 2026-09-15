import type { ProductSummary } from "../types/product";
import {
  CATALOG_PRODUCTS,
  COLLECTION_LABELS,
  NOTE_LABELS,
  type CatalogProduct,
  type Concentration,
} from "../constants/catalogProducts";
import { stripHtml } from "./catalogHtml";

/**
 * When listing cards omit concentration / house / note, the static catalog
 * metadata still fills known slugs. Live cards that already send those fields
 * (including `null`) must not be re-classified from the title.
 *
 * Name/tag regex is only the temporary fallback while `data.facets` is absent.
 */

const KNOWN_FACETS = new Map(
  CATALOG_PRODUCTS.map((product) => [product.slug, product]),
);

const NOTE_KEYS = Object.keys(NOTE_LABELS);
const COLLECTION_KEYS = Object.keys(COLLECTION_LABELS);

function searchText(product: ProductSummary): string {
  return `${product.title} ${stripHtml(product.subtitle)}`.toLowerCase();
}

function deriveConcentration(text: string): Concentration {
  if (/\bedp\b|eau de parfum/.test(text)) return "edp";
  if (/extrait/.test(text)) return "extrait";
  return "extrait";
}

function deriveCollection(text: string): string {
  return COLLECTION_KEYS.find((key) => text.includes(key)) ?? "";
}

function deriveNote(text: string): string {
  return NOTE_KEYS.find((key) => text.includes(key)) ?? "";
}

function stableSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return hash;
}

function hasListingFacetFields(product: ProductSummary): boolean {
  return (
    product.concentration !== undefined ||
    product.houseCollection !== undefined ||
    product.featuredNote !== undefined
  );
}

export function toCatalogProduct(
  product: ProductSummary,
  options?: { guessFacets?: boolean },
): CatalogProduct {
  const guessFacets = options?.guessFacets !== false;
  const known = KNOWN_FACETS.get(product.slug);

  if (hasListingFacetFields(product)) {
    const concentration =
      product.concentration === "edp" || product.concentration === "extrait"
        ? product.concentration
        : null;
    return {
      ...product,
      concentration,
      collection: product.houseCollection ?? "",
      note: product.featuredNote ?? "",
      rating: known?.rating ?? 0,
      sales: known?.sales ?? 0,
    };
  }

  if (known) {
    return {
      ...product,
      concentration: known.concentration,
      collection: known.collection,
      note: known.note,
      rating: known.rating,
      sales: known.sales,
    };
  }

  if (!guessFacets) {
    return {
      ...product,
      concentration: null,
      collection: "",
      note: "",
      rating: 0,
      sales: 0,
    };
  }

  const text = searchText(product);
  const seed = stableSeed(product.id || product.slug);

  return {
    ...product,
    concentration: deriveConcentration(text),
    collection: deriveCollection(text),
    note: deriveNote(text),
    rating: 4 + (seed % 10) / 10,
    sales: seed,
  };
}

export function toCatalogProducts(
  products: readonly ProductSummary[],
  options?: { guessFacets?: boolean },
): CatalogProduct[] {
  return products.map((product) => toCatalogProduct(product, options));
}
