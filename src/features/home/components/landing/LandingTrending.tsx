"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { ProductCardTags } from "@/features/catalog/components/ProductCardTags";
import { useLoadedImages } from "@/features/catalog/hooks/useLoadedImages";
import { useLandingProducts } from "../../hooks/useLandingProducts";
import { cardEyebrow, formatMoney } from "../../utils/formatMoney";
import { AddToBagButton } from "./AddToBagButton";

export function LandingTrending() {
  const stripRef = useRef<HTMLUListElement>(null);
  const { data } = useLandingProducts(8);
  const products = data?.products ?? [];

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
    <section className="section trending" aria-labelledby="trendTitle">
      <div className="container">
        <header className="section-head">
          <div className="trending__title-row">
            <h2 className="display section-head__title" id="trendTitle">
              Trending Now
            </h2>
            <Link className="link-underline" href="/products">
              View all
            </Link>
          </div>
        </header>
        <ul
          className="trending-grid"
          role="list"
          tabIndex={0}
          aria-label="Trending now, scrollable"
          ref={stripRef}
        >
          {products.map((product) => {
            const hover = product.imageUrls?.[1];
            const hasIngredientsHover = Boolean(hover && loadedHovers.has(hover));
            return (
              <li
                className="trend-card"
                key={product.id}
                style={
                  hasIngredientsHover
                    ? ({ "--ingredients-bg": `url(${hover})` } as CSSProperties)
                    : undefined
                }
              >
                {/* Real anchor (not a ::after pseudo-element) stretched over
                    the whole card — sits below the Add-to-bag button so
                    that stays usable; the single focusable link here. */}
                <Link
                  className="trend-card__link"
                  href={`/products/${product.slug}`}
                  aria-label={product.title}
                />
                <ProductCardTags slug={product.slug} />
                {/* Ingredients hover art — a ::before background pseudo-
                    element on `.trend-card`, not `.trend-card__media`
                    (which has overflow:hidden for the bottle crop), so it
                    can grow past the card edges and show the full scene
                    via `background-size: contain` with zero cropping. */}
                <div
                  className={
                    hasIngredientsHover
                      ? "trend-card__media trend-card__media--swap"
                      : "trend-card__media"
                  }
                >
                  <Link
                    className="trend-card__media-link"
                    href={`/products/${product.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} loading="lazy" />
                    ) : (
                      <span className="bottle" aria-hidden="true" />
                    )}
                  </Link>
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
                <div className="trend-card__add-slot">
                  <AddToBagButton product={product} variant="trend" />
                </div>
                <div className="trend-card__body">
                  <p className="trend-card__eyebrow">
                    {cardEyebrow(product.subtitle)}
                  </p>
                  <h3 className="trend-card__name">{product.title}</h3>
                  <p className="trend-card__price">
                    {formatMoney(product.price, product.currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="strip-controls">
          <div className="strip-controls__arrows">
            <button
              className="arrow arrow--outline"
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
              <span className="visually-hidden">Scroll trending left</span>
            </button>
            <button
              className="arrow arrow--outline"
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
              <span className="visually-hidden">Scroll trending right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
