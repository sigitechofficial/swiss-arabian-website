"use client";

import { useEffect, useRef, useState } from "react";
import { setQuantityOptimistic, useAddToCart } from "@/features/cart";
import { atStockLimit, fullLineMessage } from "@/features/cart/utils/stockLimit";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { StockAlertButton } from "./StockAlertButton";
import { buySlot, pdpAdd, pdpBuy, pdpBuyDocked, pdpQty, pdpQtyBtn, pdpQtyValue, pdpStatus, pdpWish } from "@/styles/pdpChrome";
import type { CartLine } from "@/stores/useCartStore";
import { useCartStore } from "@/stores/useCartStore";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { useResetOnChange } from "@/hooks/useResetOnChange";

type PdpBuyBarProps = {
  product: CatalogProduct;
  cartLine: CartLine | undefined;
  onQuantityChange?: (quantity: number) => void;
};

export function PdpBuyBar({ product, cartLine, onQuantityChange }: PdpBuyBarProps) {
  const copy = useShopCopy();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [buyDocked, setBuyDocked] = useState(false);
  const [buyBarHeight, setBuyBarHeight] = useState<number | null>(null);
  const buySlotRef = useRef<HTMLDivElement>(null);
  const buyBarRef = useRef<HTMLDivElement>(null);
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const { addToCart } = useAddToCart();
  const displayQty = cartLine ? cartLine.quantity : quantity;
  const needsAlert =
    product.price == null || product.isSellable === false || product.inStock === false;

  useResetOnChange(product.slug, () => {
    setQuantity(1);
    setStatus("");
  });

  useEffect(() => {
    onQuantityChange?.(displayQty);
  }, [displayQty, onQuantityChange]);

  // Pin the same Add-to-bag row to the viewport bottom while its natural
  // slot is still below the fold, then release it back into flow once the
  // slot reaches the bottom edge. Desktop stays in normal flow.
  useEffect(() => {
    const slot = buySlotRef.current;
    const bar = buyBarRef.current;
    if (!slot || !bar || typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 767px)");

    const measure = () => {
      const height = bar.getBoundingClientRect().height;
      if (height) setBuyBarHeight(height);
      return height;
    };

    const syncDock = () => {
      if (!mq.matches) {
        setBuyDocked(false);
        return;
      }
      const height = measure() || 72;
      setBuyDocked(slot.getBoundingClientRect().top > window.innerHeight - height + 1);
    };

    syncDock();
    window.addEventListener("scroll", syncDock, { passive: true });
    window.addEventListener("resize", syncDock);
    mq.addEventListener("change", syncDock);
    const resize = new ResizeObserver(syncDock);
    resize.observe(bar);

    return () => {
      window.removeEventListener("scroll", syncDock);
      window.removeEventListener("resize", syncDock);
      mq.removeEventListener("change", syncDock);
      resize.disconnect();
    };
  }, [product.slug]);

  return (
    <>
      <div
        ref={buySlotRef}
        className={buySlot}
        style={buyDocked && buyBarHeight ? { minHeight: buyBarHeight } : undefined}
      >
        <div ref={buyBarRef} className={`${pdpBuy}${buyDocked ? ` ${pdpBuyDocked}` : ""}`}>
          {needsAlert && product.price == null ? (
            <p className={`${pdpStatus} flex items-center`}>Unavailable</p>
          ) : needsAlert ? null : (
          <div className={pdpQty}>
            <button
              className={pdpQtyBtn}
              type="button"
              aria-label="Decrease quantity"
              disabled={displayQty <= 1}
              onClick={() => {
                if (cartLine) {
                  const next = Math.max(1, cartLine.quantity - 1);
                  if (cartLine.remote || cartLine.cartItemId) {
                    setQuantityOptimistic(cartLine.variantId, next);
                  } else {
                    updateLocalQuantity(cartLine.variantId, next);
                  }
                  return;
                }
                setQuantity((current) => Math.max(1, current - 1));
              }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 10h12" />
              </svg>
            </button>
            <span className={pdpQtyValue} aria-live="polite" aria-label="Quantity">
              {displayQty}
            </span>
            <button
              className={pdpQtyBtn}
              type="button"
              aria-label="Increase quantity"
              disabled={cartLine ? atStockLimit(cartLine) : false}
              onClick={() => {
                if (cartLine) {
                  const next = Math.min(9, cartLine.quantity + 1);
                  if (cartLine.remote || cartLine.cartItemId) {
                    setQuantityOptimistic(cartLine.variantId, next);
                  } else {
                    updateLocalQuantity(cartLine.variantId, next);
                  }
                  return;
                }
                setQuantity((current) => Math.min(9, current + 1));
              }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
            </button>
          </div>
          )}

          {needsAlert ? (
            <StockAlertButton product={product} />
          ) : (
            <button
              className={pdpAdd}
              type="button"
              onClick={() => {
                if (cartLine?.maxQuantity != null && atStockLimit(cartLine)) {
                  setStatus(fullLineMessage(cartLine.maxQuantity));
                  return;
                }
                void addToCart({
                  sku: product.sku,
                  variantId: product.variantId,
                  slug: product.slug,
                  title: product.title,
                  imageUrl: product.imageUrl,
                  price: product.price,
                  currency: product.currency,
                  quantity: cartLine ? 1 : quantity,
                });
                setStatus(`Added ${product.title} to your bag.`);
              }}
            >
              {product.price != null ? `${copy("addToBag")} · ${formatMoney(product.price, product.currency)}` : copy("addToBag")}
            </button>
          )}

          {/* Saves to the customer's wishlist through the backend. Sends signed-out shoppers to sign in. */}
          <WishlistHeartButton productId={product.id} size="pdp" className={pdpWish} />
        </div>
      </div>

      {status ? (
        <p className={pdpStatus} role="status">
          {status}
        </p>
      ) : null}
    </>
  );
}
