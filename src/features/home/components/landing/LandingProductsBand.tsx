"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useLandingProducts } from "../../hooks/useLandingProducts";
import { cardEyebrow, formatMoney } from "../../utils/formatMoney";
import { AddToBagButton } from "./AddToBagButton";

/** Requested display order for this strip only (Trending keeps its own
 *  order) — anything not listed here just falls in afterwards, in the
 *  order it already comes back in. */
const DISPLAY_ORDER = [
  "patchouli-01",
  "shaghaf-oud-ahmar",
  "rose-01",
  "incense-01",
  "tobacco-01",
];

function withDisplayOrder<T extends { slug: string }>(items: T[]): T[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const ordered = DISPLAY_ORDER.map((slug) => bySlug.get(slug)).filter(
    (item): item is T => Boolean(item)
  );
  const orderedSlugs = new Set(ordered.map((item) => item.slug));
  const rest = items.filter((item) => !orderedSlugs.has(item.slug));
  return [...ordered, ...rest];
}

export function LandingProductsBand() {
  const stripRef = useRef<HTMLUListElement>(null);
  const { data } = useLandingProducts(8);
  const products = withDisplayOrder(data?.products ?? []);

  // Preload AND fully decode every ingredients hover image up front.
  // Fetching alone isn't enough — the browser can still decode a
  // background-image lazily on its first paint, and that decode (not the
  // network fetch) is what showed as a "blink" on the first fade-in: the
  // opacity transition starts, but the bitmap isn't ready to paint yet,
  // so it pops in partway through instead of ramping up smoothly.
  // `decode()` forces the bitmap to be fully rasterized ahead of time so
  // the browser can reuse it instantly when the `::before` needs it.
  useEffect(() => {
    products.forEach((product) => {
      const hover = product.imageUrls?.[1];
      if (hover && hover !== product.imageUrl) {
        const img = new Image();
        img.src = hover;
        img.decode?.().catch(() => {});
      }
    });
  }, [products]);

  const scrollBy = (direction: number) => {
    stripRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  return (
    <section className="section products-band" aria-labelledby="prodTitle">
      <div className="container">
        <header className="section-head section-head--row">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="display section-head__title" id="prodTitle">
              Our <em>products.</em>
            </h2>
          </div>
          <Link className="view-all" href="/products">
            View all fragrances
          </Link>
        </header>

        <ul
          className="product-strip"
          role="list"
          tabIndex={0}
          aria-label="Our products, scrollable"
          ref={stripRef}
        >
          {products.map((product) => {
            const hover = product.imageUrls?.[1] ?? product.imageUrl;
            const hasIngredientsHover = Boolean(hover && hover !== product.imageUrl);
            return (
              <li
                className="product-card"
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
                <Link
                  className="product-card__link"
                  href={`/products/${product.slug}`}
                  aria-label={product.title}
                />
                {/* Ingredients hover art — rendered as a ::before background
                    on `.product-card` (not `.product-card__media`, which
                    has overflow:hidden for the rounded-corner bottle crop),
                    so it can grow past the card edges and show the full
                    scene via `background-size: contain` with zero cropping,
                    at a size close to the bottle's real, uncropped scale. */}
                <div
                  className={
                    hasIngredientsHover
                      ? "product-card__media product-card__media--swap"
                      : "product-card__media"
                  }
                >
                  <Link
                    className="product-card__media-link"
                    href={`/products/${product.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        width={600}
                        height={600}
                        loading="lazy"
                      />
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
                <div className="product-card__add-slot">
                  <AddToBagButton product={product} variant="product" />
                </div>
                <div className="product-card__body">
                  <p className="product-card__eyebrow">
                    {cardEyebrow(product.subtitle)}
                  </p>
                  <h3 className="product-card__name">{product.title}</h3>
                  <p className="product-card__price">
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
              <span className="visually-hidden">Scroll products left</span>
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
              <span className="visually-hidden">Scroll products right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
