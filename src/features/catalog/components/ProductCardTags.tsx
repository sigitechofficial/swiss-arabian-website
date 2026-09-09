import { badgeForProduct } from "../constants/productBadges";

export function ProductCardTags({ slug }: { slug: string }) {
  const badge = badgeForProduct(slug);
  if (!badge) return null;

  const kind = badge === "New" ? "new" : "best-seller";

  return (
    <p className={`product-card__tags product-card__tags--${kind}`}>
      <span>{badge}</span>
    </p>
  );
}
