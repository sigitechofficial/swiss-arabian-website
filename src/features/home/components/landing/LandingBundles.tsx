"use client";

import { useState } from "react";
import Link from "next/link";
import { useLandingProducts } from "../../hooks/useLandingProducts";
import { formatMoney } from "../../utils/formatMoney";

export function LandingBundles() {
  // Desktop-only corner card (hidden below 1024px in v5-landing.css).
  const [open, setOpen] = useState(true);
  const { data } = useLandingProducts(8);
  const bundleItems = (data?.products ?? []).slice(0, 2);

  return (
    <section
      className="campaign campaign--bundles"
      id="campaign"
      aria-labelledby="campaign-heading"
    >
      <picture className="campaign__picture">
        <source
          media="(max-width: 767px)"
          srcSet="/assets/bundle-mobile-hero.webp"
          type="image/webp"
        />
        <img
          className="campaign__media"
          src="/assets/bundles-hero.jpg"
          alt="Swiss Arabian Patchouli 01 perfume bottle on display"
          width={2048}
          height={1152}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="campaign__scrim" aria-hidden="true" />
      <div className="campaign__content">
        <p className="campaign__eyebrow">Exclusive bundle offers</p>
        <h2 className="campaign__headline display" id="campaign-heading">
          Up to 25% off
        </h2>
        <p className="campaign__sub">On your favorite fragrances</p>
        <div className="campaign__actions">
          <Link className="pill pill--translucent" href="/collections/bundles">
            Shop Bundles
          </Link>
          <Link className="pill pill--translucent" href="/gift-box">
            Shop Gift Sets
          </Link>
        </div>
      </div>

      <aside
        className="shop-look"
        aria-label="Shop this bundle"
        hidden={!open}
      >
        <div className="shop-look__head">
          <span className="shop-look__title">Shop this bundle</span>
          <button
            className="shop-look__close"
            type="button"
            onClick={() => setOpen(false)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
            <span className="visually-hidden">Dismiss shop this bundle panel</span>
          </button>
        </div>
        <ul className="shop-look__list" role="list">
          {bundleItems.map((product, index) => (
            <li key={product.id}>
              <Link
                className="shop-look__item"
                href={`/products/${product.slug}`}
              >
                <img
                  className="shop-look__thumb"
                  src={product.imageUrl ?? `/assets/collection-${index + 1}.jpg`}
                  alt=""
                  width={600}
                  height={600}
                  loading="lazy"
                />
                <span className="shop-look__info">
                  <span className="shop-look__name">{product.title}</span>
                  <span className="shop-look__conc">
                    {product.subtitle ?? "Eau de Parfum"}
                  </span>
                </span>
                <span className="shop-look__price">
                  {formatMoney(product.price, product.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          className="pill pill--solid shop-look__cta"
          href="/collections/bundles"
        >
          Shop This Bundle
        </Link>
      </aside>

      <button
        className="shop-look__restore"
        type="button"
        hidden={open}
        onClick={() => setOpen(true)}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M10 4.5a1.4 1.4 0 1 1 1 2.4L10 8l7 5H3l7-5" />
        </svg>
        <span className="visually-hidden">Show shop this bundle panel</span>
      </button>
    </section>
  );
}
