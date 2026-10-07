"use client";

import { useState } from "react";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useAddToCart } from "@/features/cart";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cardAddButton, cardAddCheck, cardAddPlus } from "@/styles/productCard";

export function AddToBagButton({
  product,
  variant: _variant = "product",
}: {
  product: ProductSummary;
  variant?: "product" | "trend";
}) {
  const copy = useShopCopy();
  const { addToCart } = useAddToCart();
  const [pressed, setPressed] = useState(false);

  return (
    <button
      className={cardAddButton}
      type="button"
      aria-pressed={pressed}
      aria-label={`Add ${product.title} to bag`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        // Instant: the bag updates and opens now; the API syncs behind.
        setPressed(true);
        void addToCart({
          sku: product.sku,
          variantId: product.variantId,
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl,
          price: product.price,
          currency: product.currency,
          quantity: 1,
        });
      }}
    >
      <svg
        className={cardAddPlus}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M10 4v12M4 10h12" />
      </svg>
      <svg
        className={cardAddCheck}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 10.5l4 4 8-9.5" />
      </svg>
      <span>{copy("addToBag")}</span>
    </button>
  );
}
