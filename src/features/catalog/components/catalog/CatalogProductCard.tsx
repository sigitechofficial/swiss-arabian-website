"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { bottle } from "@/styles/landingChrome";
import {
  cardAction,
  cardAddSlot,
  cardBottle,
  cardImg,
  cardImgSwap,
  cardLink,
  cardMedia,
  cardMediaLink,
  cardMediaLinkSwap,
  cardMediaSwap,
  cardNameDense,
  cardNote,
  cardOfferTag,
  cardPriceDense,
  cardTagStack,
  gridCard,
  productCard,
  relatedName,
  relatedPrice,
} from "@/styles/productCard";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { useLoadedImages } from "../../hooks/useLoadedImages";
import { ProductCardTags } from "../ProductCardTags";

export function CatalogProductCard({
  product,
  action,
  hideAdd = false,
  addControl,
  note,
  collectionSlug,
  promotionBadge,
  promotionLabel,
  dense = true,
}: {
  product: CatalogProduct;
  /** Top-right control above the card link (e.g. the wishlist heart). */
  action?: ReactNode;
  /** Unsellable products keep the card but lose the add-to-bag pill. */
  hideAdd?: boolean;
  /** Replaces the add-to-bag control. The card layout stays the same. */
  addControl?: ReactNode;
  note?: string;
  collectionSlug?: string;
  promotionBadge?: string | null;
  promotionLabel?: string | null;
  /** Catalog grids use the tighter name/price scale. Related strips do not. */
  dense?: boolean;
}) {
  // Live catalog media 404s for some products, which would otherwise render a
  // broken-image icon and its alt text. Fall back to the same bottle
  // placeholder the card already uses when a product has no image at all.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imageFailed;

  // Only swap to the hover image once it has really loaded — a broken hover
  // URL would otherwise fade the bottle out onto a blank card.
  const hoverCandidate = product.imageUrls?.[1];
  const hover = hoverCandidate && hoverCandidate !== product.imageUrl ? hoverCandidate : null;
  const loadedImages = useLoadedImages([hover]);
  const hasIngredientsHover = !imageFailed && Boolean(hover && loadedImages.has(hover));

  return (
    <li
      className={dense ? gridCard : productCard}
      style={hasIngredientsHover ? ({ "--ingredients-bg": `url(${hover})` } as CSSProperties) : undefined}
    >
      <Link className={cardLink} href={`/products/${product.slug}`} aria-label={product.title} />
      <div className={cardTagStack}>
        <ProductCardTags slug={product.slug} tags={product.tags ?? []} collectionSlug={collectionSlug} />
        {promotionBadge ? (
          <p className={cardOfferTag} aria-label={promotionLabel || promotionBadge}>
            <span>{promotionBadge}</span>
          </p>
        ) : null}
      </div>
      <div className={hasIngredientsHover ? `${cardMedia} ${cardMediaSwap}` : cardMedia}>
        <Link
          className={hasIngredientsHover ? cardMediaLinkSwap : cardMediaLink}
          href={`/products/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          {showImage ? (
            <img
              className={hasIngredientsHover ? cardImgSwap : cardImg}
              src={product.imageUrl as string}
              alt={product.title}
              width={600}
              height={600}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className={`${bottle} ${cardBottle}`} aria-hidden="true" />
          )}
        </Link>
      </div>
      <div className={cardAction}>{action ?? <WishlistHeartButton productId={product.id} />}</div>
      {hideAdd ? null : (
        <div className={cardAddSlot}>{addControl ?? <AddToBagButton product={product} variant="product" />}</div>
      )}
      <div>
        <h3 className={dense ? cardNameDense : relatedName}>{product.title}</h3>
        <p className={dense ? cardPriceDense : relatedPrice}>{formatMoney(product.price, product.currency)}</p>
        {note ? <p className={cardNote}>{note}</p> : null}
      </div>
    </li>
  );
}
