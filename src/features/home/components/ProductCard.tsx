"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { notesFromFamily } from "@/features/cart/data/cartContent";
import { useAddCatalogProduct } from "@/features/cart/hooks/useAddCatalogProduct";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { formatMoney } from "@/features/home/data/homeContent";
import { isProductUuid } from "@/features/wishlist/utils/productId";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import type { HomeProductBadge } from "@/features/home/types/home";

/** Landing + catalog card model */
export type ProductCardModel = {
  id: string;
  name: string;
  family: string;
  price: number | null;
  image: string | null;
  images?: string[];
  slug: string;
  badge?: HomeProductBadge;
  currency?: string;
  variantId?: string;
  sku?: string;
};

type ProductCardProps = {
  product: ProductCardModel;
  addDisabled?: boolean;
  density?: "default" | "compact";
};

/** Delay before the first image switch on hover (ms). */
const HOVER_DELAY_MS = 900;
/** Interval between subsequent image switches (ms). */
const CYCLE_INTERVAL_MS = 2000;

export function ProductCard({
  product,
  addDisabled = false,
  density = "default",
}: ProductCardProps) {
  const addToCart = useAddToCart();
  const addCatalogProduct = useAddCatalogProduct();
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const currency = product.currency ?? "USD";
  const canAdd = !addDisabled && product.price != null && product.price >= 0;
  const href = `/products/${product.slug}`;
  const compact = density === "compact";

  const gallery =
    product.images?.length ?
      product.images
    : product.image ?
      [product.image]
    : [];
  const hasGallery = gallery.length > 1;
  const safeIndex = Math.min(active, Math.max(0, gallery.length - 1));
  const showImage = Boolean(gallery[safeIndex]) && !failed[safeIndex];

  // Timer refs — mutated imperatively, no re-render needed.
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimers() {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (cycleRef.current !== null) {
      clearInterval(cycleRef.current);
      cycleRef.current = null;
    }
  }

  function handleMouseEnter() {
    if (!hasGallery) return;
    clearTimers();
    delayRef.current = setTimeout(() => {
      setActive(1);
      cycleRef.current = setInterval(() => {
        setActive((prev) => (prev + 1) % gallery.length);
      }, CYCLE_INTERVAL_MS);
    }, HOVER_DELAY_MS);
  }

  function handleMouseLeave() {
    clearTimers();
    setActive(0);
  }

  // Reset gallery state when the product changes.
  useEffect(() => {
    clearTimers();
    setFailed({});
    setActive(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.image, product.images?.join("|")]);

  // Cleanup on unmount.
  useEffect(() => () => clearTimers(), []);

  const badge =
    product.badge === "new" ? (
      <span
        className={`absolute z-[1] bg-gold font-bold uppercase tracking-[0.12em] text-paper ${
          compact
            ? "left-2 top-2 px-1.5 py-0.5 text-[8px]"
            : "left-3 top-3 px-[11px] py-[6px] text-[10px]"
        }`}
      >
        New
      </span>
    ) : product.badge === "trending" ? (
      <span
        className={`absolute z-[1] bg-terra font-bold uppercase tracking-[0.12em] text-paper ${
          compact
            ? "left-2 top-2 px-1.5 py-0.5 text-[8px]"
            : "left-3 top-3 px-[11px] py-[6px] text-[10px]"
        }`}
      >
        ↗ Trending
      </span>
    ) : null;

  return (
    <article
      className="group relative flex flex-col overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isProductUuid(product.id) ? (
        <div
          className={`absolute z-[2] ${compact ? "right-1.5 top-1.5" : "right-3 top-3"}`}
        >
          <WishlistHeartButton productId={product.id} size="card" />
        </div>
      ) : null}
      <Link href={href} className="flex flex-1 cursor-pointer flex-col">
        <div
          className={`relative flex aspect-square items-center justify-center overflow-hidden ${
            compact ? "p-1.5" : "p-3"
          }`}
        >
          {badge}
          {showImage ? (
            <div className="relative h-full w-full">
              {gallery.map((src, index) => {
                if (failed[index]) return null;
                const isActive = index === safeIndex;
                return (
                  <Image
                    key={`${product.id}-${src}-${index}`}
                    src={src}
                    alt={isActive ? product.name : ""}
                    fill
                    aria-hidden={!isActive}
                    className={`object-contain transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                    sizes={
                      compact
                        ? "(max-width: 480px) 40vw, 160px"
                        : "(max-width: 768px) 50vw, 287px"
                    }
                    onError={() =>
                      setFailed((prev) => ({ ...prev, [index]: true }))
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-center"
              aria-hidden
            >
              <span className="max-w-[8rem] text-[10px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                Image coming soon
              </span>
            </div>
          )}
        </div>

        <div
          className={`flex flex-1 flex-col ${compact ? "px-0.5 pt-2" : "px-1 pt-3"}`}
        >
          <p
            className={`truncate font-semibold uppercase text-sa-muted ${
              compact
                ? "text-[9px] tracking-[0.12em]"
                : "text-[11px] tracking-[0.14em]"
            }`}
          >
            {product.family}
          </p>
          <h3
            className={`font-sans text-sa-primary transition-opacity hover:opacity-80 ${
              compact
                ? "mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug tracking-[-0.01em]"
                : "mt-1 line-clamp-2 min-h-[2.6em] text-[20.5px] font-medium leading-snug tracking-[-0.01em]"
            }`}
          >
            {product.name}
          </h3>
          <p
            className={`font-sans font-bold tabular-nums ${
              compact ? "mt-1 text-[13px]" : "mt-2 text-base"
            } ${product.price == null ? "text-sa-muted" : "text-sa-primary"}`}
          >
            {product.price == null
              ? "Price unavailable"
              : formatMoney(product.price, currency)}
          </p>
        </div>
      </Link>

      <div className={compact ? "pt-2" : "px-1 pb-1 pt-3"}>
        <button
          type="button"
          disabled={!canAdd || adding}
          onClick={() => {
            if (!canAdd || product.price == null || adding) return;
            const imageUrl = gallery[safeIndex] ?? product.image ?? undefined;
            if (product.variantId || product.sku) {
              addToCart({
                productId: product.id,
                variantId: product.variantId ?? product.id,
                slug: product.slug,
                title: product.name,
                imageUrl,
                unitPrice: product.price,
                currency,
                notes: notesFromFamily(product.family),
                sku: product.sku,
                category: product.family || null,
              });
              return;
            }
            setAdding(true);
            void addCatalogProduct({
              slug: product.slug,
              title: product.name,
              imageUrl,
              price: product.price,
              family: product.family,
            }).finally(() => setAdding(false));
          }}
          className={`flex w-full cursor-pointer items-center justify-center bg-terra font-semibold uppercase text-white transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:bg-sa-border disabled:text-sa-muted ${
            compact
              ? "h-8 text-[10px] tracking-[0.08em]"
              : "h-[42px] text-[12px] tracking-[0.1em]"
          }`}
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </div>
    </article>
  );
}
