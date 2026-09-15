export type ProductBadge = "New" | "Best Seller";

/**
 * Catalog `tags[]` is a mixed bag: merch labels, categories, and ops flags.
 * Cards only render the two shopper badges the UI already supports.
 *
 * Ignored on purpose (do not dump these on the card):
 * - ops: `a-grade`, `d365-translation-added`, `not for sale`, `sep25`
 * - category: `perfume`, `incense`, `oud muattar`
 * - collection names: `Gifting Collection`
 * - promo leftovers: `30%`
 *
 * API `badges: ["SELLABLE"]` is sellability, not a merch chip.
 */

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

const BEST_SELLER = new Set(["best seller", "best sellers", "bestseller"]);
const NEW = new Set(["new", "new launch", "new launches"]);

function isBestSellerish(normalized: string): boolean {
  return BEST_SELLER.has(normalized) || /\bbest sellers?\b/.test(normalized) || normalized.includes("bestseller");
}

function isGenericBestSeller(normalized: string): boolean {
  return BEST_SELLER.has(normalized);
}

function mentionsCollection(normalized: string, collectionSlug: string): boolean {
  const col = normalizeTag(collectionSlug);
  if (!col) return false;
  if (normalized.includes(col)) return true;
  const tokens = col.split(" ").filter((token) => token.length > 2 && token !== "best" && token !== "sellers");
  return tokens.some((token) => normalized.includes(token));
}

/** Heritage “01” line — landing static cards only, until they carry tags. */
const NEW_SLUGS = new Set([
  "patchouli-01",
  "incense-01",
  "tobacco-01",
  "rose-01",
  "vanilla-01",
]);

const NO_BADGE_SLUGS = new Set(["shaghaf-oud-ahmar"]);

/** One badge. Best Seller wins when both merch tags are present. */
export function shopperBadgeFromTags(
  tags: readonly string[] | null | undefined,
  collectionSlug?: string,
): ProductBadge | null {
  if (!tags?.length) return null;
  const normalized = tags.map(normalizeTag);
  const bestTags = normalized.filter(isBestSellerish);
  const bestForCollection = collectionSlug
    ? bestTags.filter((tag) => isGenericBestSeller(tag) || mentionsCollection(tag, collectionSlug))
    : bestTags;
  if (bestForCollection.length) return "Best Seller";
  if (normalized.some((tag) => NEW.has(tag))) return "New";
  return null;
}

function badgeFromStaticSlug(slug: string | undefined): ProductBadge | null {
  if (!slug || NO_BADGE_SLUGS.has(slug)) return null;
  if (NEW_SLUGS.has(slug)) return "New";
  return null;
}

/**
 * Live catalog: pass `tags` (use `[]` when the API sent none).
 * Landing static cards: omit `tags` so the old slug map still applies.
 */
export function badgeForProduct(input: {
  tags?: readonly string[] | null;
  slug?: string;
  collectionSlug?: string;
}): ProductBadge | null {
  if (input.tags !== undefined) return shopperBadgeFromTags(input.tags, input.collectionSlug);
  return badgeFromStaticSlug(input.slug);
}
