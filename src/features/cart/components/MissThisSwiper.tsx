"use client";

import { useRef } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";

export function CheckoutAddonRow({
  product,
  adding,
  onAdd,
  compact = false,
}: {
  product: CatalogProduct;
  adding: boolean;
  onAdd: (product: CatalogProduct) => void;
  compact?: boolean;
}) {
  return (
    <article className="checkout-addon">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt="" />
      ) : (
        <span className="checkout-addon__ph" aria-hidden="true" />
      )}
      <div>
        <p className="checkout-addon__name">{product.title}</p>
        <p className="checkout-addon__price">{formatMoney(product.price ?? 0, product.currency)}</p>
      </div>
      <button
        type="button"
        className="checkout-addon__add"
        disabled={adding}
        onClick={() => onAdd(product)}
        aria-label={adding ? `Adding ${product.title}` : `Add ${product.title}`}
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
}: {
  products: CatalogProduct[];
  addingSlug: string | null;
  onAdd: (product: CatalogProduct) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const step = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".checkout-addon");
    const gap = 10;
    const width = card instanceof HTMLElement ? card.getBoundingClientRect().width + gap : 200;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  return (
    <div className="checkout-miss-inline" aria-labelledby="checkout-miss-heading">
      <div className="checkout-miss-inline__head">
        <h3 className="checkout-miss-inline__title" id="checkout-miss-heading">
          Don’t miss this
        </h3>
        {products.length > 2 ? (
          <div className="checkout-miss-inline__nav">
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
      <div className="checkout-miss-inline__list" ref={scrollerRef}>
        {products.map((product) => (
          <CheckoutAddonRow
            key={product.id}
            product={product}
            adding={addingSlug === product.slug}
            onAdd={onAdd}
            compact
          />
        ))}
      </div>
    </div>
  );
}
