/**
 * Sapil product card container and its parts, for any Sapil page.
 *
 *   <WishlistStatusScope>                      // one wishlist request per grid
 *     <SapilProductCard product={p} imagePriority={i === 0 ? "high" : i < 4 ? "eager" : "lazy"} />
 *   </WishlistStatusScope>
 *
 * See SapilProductCard for the props, productCardModel for the mapping rules.
 */
export {
  SapilProductCard,
  SAPIL_CARD_SIZES,
  type SapilProductCardProps,
  type CardImagePriority,
} from "./SapilProductCard";
export { SapilWishlistButton } from "./SapilWishlistButton";
export { SapilQuickView } from "./SapilQuickView";
export { SapilLocaleLink } from "./SapilLocaleLink";
export {
  toSapilCardModel,
  formatSapilPrice,
  productTile,
  productTags,
  productGender,
  productShape,
  discountPercent,
  isOutOfStock,
  DEFAULT_TILE,
  type SapilCardModel,
  type ProductGender,
} from "./productCardModel";
