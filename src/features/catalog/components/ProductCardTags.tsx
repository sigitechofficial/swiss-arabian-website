import { cardTags, cardTagsNew } from "@/styles/productCard";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { badgeForProduct, PRODUCT_BADGE_LABEL } from "../constants/productBadges";

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
  const t = useShopCopy();
  const badge = badgeForProduct({ slug, tags, collectionSlug });
  if (!badge) return null;

  return (
    <p className={badge === "new" ? `${cardTags} ${cardTagsNew}` : cardTags}>
      <span>{t(PRODUCT_BADGE_LABEL[badge])}</span>
    </p>
  );
}
