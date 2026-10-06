"use client";

import { useRef } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import {
  checkoutAddon,
  checkoutAddonAdd,
  checkoutAddonMedia,
  checkoutAddonName,
  checkoutAddonPrice,
  checkoutMiss,
  checkoutMissCard,
  checkoutMissHead,
  checkoutMissList,
  checkoutMissNav,
  checkoutMissTitle,
} from "@/styles/checkoutChrome";

export function CheckoutAddonRow({
  product,
  adding,
  onAdd,
  compact = false,
  disabled = false,
}: {
  product: CatalogProduct;
  adding: boolean;
  onAdd: (product: CatalogProduct) => void;
  compact?: boolean;
  /** Shown but not addable (e.g. static items with no live SKU yet). */
  disabled?: boolean;
}) {
  const unavailableLabel = `${product.title} can’t be added yet`;
  return (
    <article className={compact ? checkoutMissCard : checkoutAddon} data-addon="">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={checkoutAddonMedia} src={product.imageUrl} alt="" />
      ) : (
        <span className={checkoutAddonMedia} data-addon-ph="" aria-hidden="true" />
      )}
      <div>
        <p className={checkoutAddonName}>{product.title}</p>
        <p className={checkoutAddonPrice}>{formatMoney(product.price ?? 0, product.currency)}</p>
      </div>
      <button
        type="button"
        className={checkoutAddonAdd}
        disabled={adding || disabled}
        onClick={() => onAdd(product)}
        title={disabled ? unavailableLabel : undefined}
        aria-label={
          disabled ? unavailableLabel : adding ? `Adding ${product.title}` : `Add ${product.title}`
        }
      >
        {compact ? (adding ? "…" : "+") : adding ? "Adding" : "+ Add"}
      </button>
    </article>
  );
}

export function MissThisSwiper({
  products,
  addingSlug,
  onAdd,
  canAdd,
}: {
  products: CatalogProduct[];
  addingSlug: string | null;
  onAdd: (product: CatalogProduct) => void;
  /** Omit to allow adding every product (cart page behaviour). */
  canAdd?: (product: CatalogProduct) => boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const step = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-addon]");
    const gap = 10;
    const width = card instanceof HTMLElement ? card.getBoundingClientRect().width + gap : 200;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  return (
    <div className={checkoutMiss} aria-labelledby="checkout-miss-heading">
      <div className={checkoutMissHead}>
        <h3 className={checkoutMissTitle} id="checkout-miss-heading">
          Don’t miss this
        </h3>
        {products.length > 2 ? (
          <div className={checkoutMissNav}>
            <button type="button" onClick={() => step(-1)} aria-label="Previous products">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next products">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <div className={checkoutMissList} ref={scrollerRef}>
        {products.map((product) => (
          <CheckoutAddonRow
            key={product.id}
            product={product}
            adding={addingSlug === product.slug}
            onAdd={onAdd}
            disabled={canAdd ? !canAdd(product) : false}
            compact
          />
        ))}
      </div>
    </div>
  );
}
