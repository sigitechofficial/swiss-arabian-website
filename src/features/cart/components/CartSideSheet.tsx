"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ProductCard } from "@/features/home/components/ProductCard";
import { formatUsd } from "@/features/home/data/homeContent";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { cartEmptySuggestions, cartUpsells } from "../data/cartContent";
import { CartLineItem } from "./CartLineItem";
import { FreeShippingProgress } from "./FreeShippingProgress";

/**
 * Cart side sheet — sticky footer with total + checkout.
 * Desktop 480 · tablet 340 · mobile full-bleed
 */
export function CartSideSheet() {
  const open = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const subtotal = useCartStore((s) => s.subtotal());

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const hasItems = lines.length > 0;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCartOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setCartOpen]);

  function close() {
    setCartOpen(false);
  }

  return (
    <div
      className={`fixed inset-0 z-[100] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart"
        tabIndex={open ? 0 : -1}
        onClick={close}
      />

      <aside
        id="cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`absolute inset-y-0 right-0 flex w-full flex-col sa-hairline-l bg-surface text-sa-primary shadow-[-8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 sm:w-[340px] lg:w-[480px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="shrink-0 sa-hairline-b px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="font-sans text-[18px] font-bold tracking-tight text-sa-primary sm:text-[20px]">
                Your Cart
              </h2>
              <span className="flex h-6 min-w-6 items-center justify-center bg-ash px-2 text-[11px] font-semibold text-sa-primary">
                {itemCount}
              </span>
            </div>
            <button
              type="button"
              className="flex size-9 items-center justify-center text-sa-muted transition-colors hover:text-sa-primary"
              aria-label="Close cart"
              onClick={close}
            >
              <span className="text-[18px] leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="sa-scrollbar sa-scrollbar-panel min-h-0 flex-1 overflow-y-auto">
          {!hasItems ? (
            <div className="flex flex-col">
              <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
                <p className="text-[15px] font-semibold text-sa-primary">
                  Your cart is empty
                </p>
                <p className="mx-auto mt-2 max-w-[240px] text-[13px] leading-relaxed text-sa-muted">
                  Add a fragrance to get started.
                </p>
                <Link
                  href="/collections/best-sellers"
                  onClick={close}
                  className="mt-6 inline-flex h-11 w-full max-w-sm items-center justify-center bg-terra px-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a25e48]"
                >
                  Continue shopping
                </Link>
              </div>

              <div className="px-6 py-5 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                  You may also like
                </p>
                <div
                  className="mt-4 grid grid-cols-2 gap-3 sm:gap-4"
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a")) close();
                  }}
                >
                  {cartEmptySuggestions.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      density="compact"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <ul>
                {lines.map((line) => (
                  <li
                    key={line.variantId}
                    className="px-6 py-5 sm:px-8 sm:py-6"
                  >
                    <CartLineItem
                      line={line}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeLine}
                    />
                  </li>
                ))}
              </ul>

              <div className="px-6 py-5 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                  You may also like
                </p>
                <div
                  className="mt-4 grid grid-cols-2 gap-3 sm:gap-4"
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a")) close();
                  }}
                >
                  {cartUpsells.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      density="compact"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky footer — only when cart has items */}
        {hasItems ? (
          <div className="shrink-0 sa-hairline-t bg-section-soft px-6 py-5 sm:px-8 sm:py-6">
            <FreeShippingProgress subtotal={subtotal} />

            <Link
              href="/checkout"
              onClick={close}
              className="flex h-11 w-full items-center justify-between gap-3 bg-terra px-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a25e48]"
            >
              <span>Checkout</span>
              <span className="tabular-nums tracking-normal">
                {formatUsd(subtotal)}
              </span>
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
