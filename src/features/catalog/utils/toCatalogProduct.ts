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
 * The catalog API returns no facet attributes — no concentration, house
 * collection, or featured note — but the filter rail is built on them. So they
 * are derived here: hand-authored metadata wins for products we already know,
 * and anything new is classified from its own name/description text.
 *
 * These are best-effort labels for filtering, not authoritative product data.
 * When the API grows real facet fields, this is the single place to swap.
 */

/** Hand-authored facets, keyed by slug, from the static catalog. */
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
  // Eau de toilette / mist / oil etc. aren't separate rail options; the rail
  // only offers Extrait vs EDP, so unmatched products sit under Extrait.
  return "extrait";
}

function deriveCollection(text: string): string {
  return COLLECTION_KEYS.find((key) => text.includes(key)) ?? "";
}

function deriveNote(text: string): string {
  return NOTE_KEYS.find((key) => text.includes(key)) ?? "";
}

/**
 * Deterministic stand-ins for the rating/sales sorts, which have no API
 * equivalent. Derived from the id so ordering is stable between renders
 * instead of reshuffling on every fetch.
 */
function stableSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return hash;
}

export function toCatalogProduct(product: ProductSummary): CatalogProduct {
  const known = KNOWN_FACETS.get(product.slug);
  if (known) {
    // Keep the live API values (price, images, stock) but reuse the authored
    // facets so known products filter exactly as they do today.
    return {
      ...product,
      concentration: known.concentration,
      collection: known.collection,
      note: known.note,
      rating: known.rating,
      sales: known.sales,
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
): CatalogProduct[] {
  return products.map(toCatalogProduct);
}
