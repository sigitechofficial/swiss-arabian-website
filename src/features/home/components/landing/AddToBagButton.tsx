"use client";

import { useState } from "react";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useAddToCart } from "@/features/cart";

export function AddToBagButton({
  product,
  variant = "product",
}: {
  product: ProductSummary;
  variant?: "product" | "trend";
}) {
  const { addToCart, isPending } = useAddToCart();
  const [pressed, setPressed] = useState(false);
  const prefix = variant === "trend" ? "trend-card" : "product-card";

  return (
    <button
      className={`${prefix}__add`}
      type="button"
      aria-pressed={pressed}
      aria-label={`Add ${product.title} to bag`}
      disabled={isPending}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await addToCart({
          sku: product.sku,
          variantId: product.variantId,
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl,
          price: product.price,
          currency: product.currency,
          quantity: 1,
        });
        setPressed(true);
      }}
    >
      <svg
        className={`${prefix}__add-plus`}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M10 4v12M4 10h12" />
      </svg>
      <svg
        className={`${prefix}__add-check`}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 10.5l4 4 8-9.5" />
      </svg>
      <span>{isPending ? "Adding…" : "Add to bag"}</span>
    </button>
  );
}
