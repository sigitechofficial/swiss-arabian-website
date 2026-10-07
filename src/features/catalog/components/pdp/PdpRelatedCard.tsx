"use client";

import { useState, type CSSProperties } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { bottle } from "@/styles/landingChrome";
import {
  cardAddSlot,
  cardBottle,
  cardImg,
  cardImgSwap,
  cardLink,
  cardMedia,
  cardMediaLink,
  cardMediaLinkSwap,
  cardMediaSwap,
  productCard,
  relatedName,
  relatedPrice,
} from "@/styles/productCard";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { useLoadedImages } from "../../hooks/useLoadedImages";
import { ProductCardTags } from "../ProductCardTags";

export function PdpRelatedCard({
  product,
  collectionSlug,
}: {
  product: CatalogProduct;
  collectionSlug?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imageFailed;

  const hoverCandidate = product.imageUrls?.[1];
  const hover = hoverCandidate && hoverCandidate !== product.imageUrl ? hoverCandidate : null;
  const loadedImages = useLoadedImages([hover]);
  const hasIngredientsHover = !imageFailed && Boolean(hover && loadedImages.has(hover));

  return (
    <li
      className={productCard}
      style={
        hasIngredientsHover ? ({ "--ingredients-bg": `url(${hover})` } as CSSProperties) : undefined
      }
    >
      <LocaleLink className={cardLink} href={`/products/${product.slug}`} aria-label={product.title} />
      <ProductCardTags slug={product.slug} tags={product.tags ?? []} collectionSlug={collectionSlug} />
      <div className={hasIngredientsHover ? `${cardMedia} ${cardMediaSwap}` : cardMedia}>
        <LocaleLink
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
        </LocaleLink>
      </div>
      <div className={cardAddSlot}>
        <AddToBagButton product={product} variant="product" />
      </div>
      <div>
        <h3 className={relatedName}>{product.title}</h3>
        <p className={relatedPrice}>{formatMoney(product.price, product.currency)}</p>
      </div>
    </li>
  );
}
