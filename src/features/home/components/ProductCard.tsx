"use client";

import Image from "next/image";
import Link from "next/link";
import { notesFromFamily } from "@/features/cart/data/cartContent";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { formatMoney } from "@/features/home/data/homeContent";
import type { HomeProductBadge } from "@/features/home/types/home";

/** Landing + catalog card model */
export type ProductCardModel = {
  id: string;
  name: string;
  family: string;
  price: number | null;
  image: string | null;
  slug: string;
  badge?: HomeProductBadge;
  currency?: string;
  variantId?: string;
};

type ProductCardProps = {
  product: ProductCardModel;
  /** Disable ATC (e.g. out of stock / price missing) */
  addDisabled?: boolean;
};

export function ProductCard({
  product,
  addDisabled = false,
}: ProductCardProps) {
  const addToCart = useAddToCart();
  const currency = product.currency ?? "USD";
  const canAdd =
    !addDisabled && product.price != null && product.price >= 0;
  const href = `/products/${product.slug}`;

  const badge =
    product.badge === "new" ? (
      <span className="absolute left-3 top-3 z-[1] bg-gold px-[11px] py-[6px] text-[10px] font-bold uppercase tracking-[0.12em] text-paper">
        New
      </span>
    ) : product.badge === "trending" ? (
      <span className="absolute left-3 top-3 z-[1] bg-terra px-[11px] py-[6px] text-[10px] font-bold uppercase tracking-[0.12em] text-paper">
        ↗ Trending
      </span>
    ) : null;

  return (
    <article className="flex flex-col overflow-hidden bg-surface">
      <Link href={href} className="flex flex-1 cursor-pointer flex-col">
        <div className="sa-card-media relative flex aspect-[287/330] items-center justify-center p-6">
          {badge}
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={200}
              height={260}
              className="max-h-full w-auto object-contain"
              sizes="(max-width: 768px) 50vw, 287px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-center"
              aria-hidden
            >
              <span className="max-w-[8rem] text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                Image coming soon
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pt-5">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
            {product.family}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[57px] font-sans text-[20.5px] font-medium leading-snug tracking-[-0.01em] text-sa-primary transition-opacity group-hover:opacity-80 hover:opacity-80">
            {product.name}
          </h3>
          <p
            className={`mt-2 font-sans text-base font-bold ${
              product.price == null ? "text-sa-muted" : "text-sa-primary"
            }`}
          >
            {product.price == null
              ? "Price unavailable"
              : formatMoney(product.price, currency)}
          </p>
        </div>
      </Link>
      <div className="p-5 pt-4">
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd || product.price == null) return;
            addToCart({
              productId: product.id,
              variantId: product.variantId ?? product.id,
              slug: product.slug,
              title: product.name,
              imageUrl: product.image ?? undefined,
              unitPrice: product.price,
              currency,
              notes: notesFromFamily(product.family),
            });
          }}
          className="flex h-[42px] w-full cursor-pointer items-center justify-center bg-terra text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:bg-sa-border disabled:text-sa-muted"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
