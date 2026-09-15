import { badgeForProduct } from "../constants/productBadges";

export function ProductCardTags({
  slug,
  tags,
  collectionSlug,
}: {
  slug?: string;
  tags?: readonly string[] | null;
  /** When set, collection-scoped tags like `cities-best-sellers` only badge that PLP. */
  collectionSlug?: string;
}) {
  const badge = badgeForProduct({ slug, tags, collectionSlug });
  if (!badge) return null;

  const kind = badge === "New" ? "new" : "best-seller";

  return (
    <p className={`product-card__tags product-card__tags--${kind}`}>
      <span>{badge}</span>
    </p>
  );
}
