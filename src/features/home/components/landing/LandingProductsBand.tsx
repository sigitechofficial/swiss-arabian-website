"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { ProductCardTags } from "@/features/catalog/components/ProductCardTags";
import { useLoadedImages } from "@/features/catalog/hooks/useLoadedImages";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useHomeCollectionProducts } from "../../hooks/useHomeCollectionProducts";
import { HomeStripSkeleton } from "./HomeStripSkeleton";
import { formatMoney } from "../../utils/formatMoney";
import { AddToBagButton } from "./AddToBagButton";
import {
  cardAddSlot,
  cardBottle,
  cardImg,
  cardImgSwap,
  cardLink,
  cardMedia,
  cardMediaInset,
  cardMediaLink,
  cardMediaLinkSwap,
  cardMediaSwap,
  cardName,
  cardPrice,
  productStrip,
  stripCard,
} from "@/styles/productCard";
import {
  arrowOutline,
  bottle,
  linkUnderline,
  productsBand,
  productsBandHead,
  productsBandTitleEm,
  sectionTitle,
  sectionTitleFlush,
  stripArrows,
  stripControls,
} from "@/styles/landingChrome";
import { pageContainer, visuallyHidden } from "@/styles/siteChrome";

export type LandingProductsBandProps = {
  /** When provided, skips the best-sellers collection fetch. */
  products?: ProductSummary[];
  title?: ReactNode;
  viewAllHref?: string | null;
  viewAllLabel?: string | null;
  collectionSlug?: string;
};

export function LandingProductsBand({
  products: productsProp,
  title,
  viewAllHref,
  viewAllLabel,
  collectionSlug = "best-sellers",
}: LandingProductsBandProps = {}) {
  const stripRef = useRef<HTMLUListElement>(null);
  const fetched = useHomeCollectionProducts("best-sellers", 8);
  const fromCms = productsProp !== undefined;
  const products = fromCms ? productsProp : fetched.products;
  const pending = fromCms ? false : fetched.pending;
  const live = fromCms ? true : fetched.live;
  const allHref = viewAllHref ?? `/collections/${collectionSlug}`;
  const heading =
    title ?? (
      <>
        Our <em className={productsBandTitleEm}>best sellers.</em>
      </>
    );

  // Preload AND fully decode every ingredients hover image up front (so the
  // first fade-in doesn't blink), and only swap to the ones that actually
  // loaded — a broken hover URL would fade the bottle out onto a blank card.
  const loadedHovers = useLoadedImages(
    products.map((product) =>
      product.imageUrls?.[1] !== product.imageUrl ? product.imageUrls?.[1] : null,
    ),
  );

  const scrollBy = (direction: number) => {
    stripRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  return (
    <section className={productsBand} aria-labelledby="prodTitle">
      <div className={pageContainer}>
        <header className={productsBandHead}>
          <div>
            <h2 className={`${sectionTitle} ${sectionTitleFlush}`} id="prodTitle">
              {heading}
            </h2>
          </div>
          {allHref ? (
            <LocaleLink
              className={`${linkUnderline} shrink-0 whitespace-nowrap`}
              href={allHref}
            >
              {viewAllLabel?.trim() || "View all"}
            </LocaleLink>
          ) : null}
        </header>

        <ul
          className={productStrip}
          role="list"
          tabIndex={0}
          aria-label="Our best sellers, scrollable"
          aria-busy={pending}
          ref={stripRef}
        >
          {pending ? <HomeStripSkeleton /> : null}
          {products.map((product) => {
            const hoverCandidate = product.imageUrls?.[1];
            const hover =
              hoverCandidate && hoverCandidate !== product.imageUrl ? hoverCandidate : null;
            const hasIngredientsHover = Boolean(hover && loadedHovers.has(hover));
            return (
              <li
                className={stripCard}
                key={product.id}
                style={
                  hasIngredientsHover
                    ? ({ "--ingredients-bg": `url(${hover})` } as CSSProperties)
                    : undefined
                }
              >
                {/* Real anchor (not a ::after pseudo-element) stretched over
                    the whole card so it's clickable anywhere — sits below
                    the Add-to-bag button (z-index) so that stays usable.
                    This is the single focusable/accessible link for the
                    card; the media link and name text below are inert. */}
                <LocaleLink
                  className={cardLink}
                  href={`/products/${product.slug}`}
                  aria-label={product.title}
                />
                <ProductCardTags
                  slug={product.slug}
                  tags={live ? (product.tags ?? []) : undefined}
                  collectionSlug={live ? collectionSlug : undefined}
                />
                {/* Ingredients hover art — rendered as a ::before background
                    on `.product-card` (not `.product-card__media`, which
                    has overflow:hidden for the rounded-corner bottle crop),
                    so it can grow past the card edges and show the full
                    scene via `background-size: contain` with zero cropping,
                    at a size close to the bottle's real, uncropped scale. */}
                <div
                  className={
                    live
                      ? hasIngredientsHover
                        ? `${cardMedia} ${cardMediaSwap}`
                        : cardMedia
                      : hasIngredientsHover
                        ? `${cardMediaInset} ${cardMediaSwap}`
                        : cardMediaInset
                  }
                >
                  <LocaleLink
                    className={hasIngredientsHover ? cardMediaLinkSwap : cardMediaLink}
                    href={`/products/${product.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {product.imageUrl ? (
                      <img
                        className={hasIngredientsHover ? cardImgSwap : cardImg}
                        src={product.imageUrl}
                        alt={product.title}
                        width={600}
                        height={600}
                        loading="lazy"
                      />
                    ) : (
                      <span className={`${bottle} ${cardBottle}`} aria-hidden="true" />
                    )}
                  </LocaleLink>
                </div>
                {/* Its own slot (sibling of the media box, not nested
                    inside it) — the media box is `isolation: isolate` so
                    its own z-index doesn't compete at the card level,
                    which let the ingredients `::before` (z-index 4, a
                    pseudo-element of the card) render on top of the whole
                    media box including this button. Mirroring the media
                    box's exact geometry here keeps the button visually
                    anchored the same way while its z-index competes
                    directly against `::before` and wins. */}
                {product.inStock !== false ? (
                  <div className={cardAddSlot}>
                    <AddToBagButton product={product} variant="product" />
                  </div>
                ) : null}
                <div>
                  <h3 className={cardName}>{product.title}</h3>
                  <p className={cardPrice}>
                    {formatMoney(product.price, product.currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className={stripControls}>
          <div className={stripArrows}>
            <button
              className={arrowOutline}
              type="button"
              onClick={() => scrollBy(-1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
              <span className={visuallyHidden}>Scroll products left</span>
            </button>
            <button
              className={arrowOutline}
              type="button"
              onClick={() => scrollBy(1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
              <span className={visuallyHidden}>Scroll products right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
