"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { formatUsd } from "@/features/home/data/homeContent";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  cartAssets,
  cartUpsells,
  FREE_SHIPPING_THRESHOLD,
} from "../data/cartContent";
import { useAddToCart } from "../hooks/useAddToCart";

/**
 * Add-to-cart side sheet — Figma 475:7285 / section 518:7097
 * Desktop 480 · tablet 340 · mobile full-bleed
 */
export function CartSideSheet() {
  const open = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const subtotal = useCartStore((s) => s.subtotal());
  const addToCart = useAddToCart();

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

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
        className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-sa-border bg-surface text-sa-primary shadow-[-8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 sm:w-[340px] lg:w-[480px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Scrollable body */}
        <div className="sa-scrollbar sa-scrollbar-panel flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-8 pb-5 pt-7">
            <div className="flex items-center gap-3">
              <h2 className="font-sans text-[20px] font-bold leading-tight text-sa-primary">
                Your Cart
              </h2>
              <span className="rounded-xl bg-ash px-2 py-1 text-[12px] font-semibold text-sa-primary">
                {itemCount}
              </span>
            </div>
            <button
              type="button"
              className="p-2 text-[17px] font-bold leading-none text-sa-muted transition-opacity hover:opacity-70"
              aria-label="Close cart"
              onClick={close}
            >
              ✕
            </button>
          </div>

          <div className="h-px w-full bg-sa-border" />

          {lines.length === 0 ? (
            <div className="px-8 py-10 text-center">
              <p className="text-[15px] font-semibold text-sa-primary">
                Your cart is empty
              </p>
              <p className="mt-2 text-[13px] text-sa-muted">
                Add a fragrance to get started.
              </p>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.variantId}>
                <div className="flex gap-4 px-8 py-6">
                  <div className="flex h-[110px] w-[100px] shrink-0 items-center justify-center overflow-hidden bg-section-soft">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        width={80}
                        height={90}
                        className="h-[90px] w-20 object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div>
                      <p className="truncate font-sans text-[17px] font-bold leading-tight text-sa-primary">
                        {line.title}
                      </p>
                      {line.sizeLabel ? (
                        <p className="mt-1 text-[12px] leading-normal text-sa-muted">
                          {line.sizeLabel}
                        </p>
                      ) : null}
                      <p className="mt-1 font-sans text-base font-bold text-terra">
                        {formatUsd(line.unitPrice)}
                      </p>
                    </div>

                    {line.notes && line.notes.length > 0 ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                        {line.notes.map((note) => (
                          <span
                            key={note}
                            className="border border-sa-input bg-section-soft px-2 py-1 text-[9px] font-bold leading-none text-sa-muted"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <div className="flex h-8 items-center border border-sa-input">
                        <button
                          type="button"
                          className="px-3 text-[14px] font-semibold text-sa-muted"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="min-w-[25px] px-2 text-center text-[14px] font-semibold text-sa-primary">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-3 text-[14px] font-semibold text-sa-muted"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="px-2 py-1 text-[12px] font-semibold text-sa-muted hover:text-sa-primary"
                        onClick={() => removeLine(line.variantId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-px w-full bg-sa-border" />
              </div>
            ))
          )}

          {/* Upsells */}
          <div className="flex flex-col gap-4 px-8 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
              You may also like
            </p>
            <div className="flex flex-col gap-3">
              {cartUpsells.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 border border-sa-border bg-section-soft p-3"
                >
                  <div className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden bg-white dark:bg-surface">
                    <Image
                      src={product.image}
                      alt=""
                      width={36}
                      height={42}
                      className="h-[42px] w-9 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-sa-primary">
                      {product.name}
                    </p>
                    <p className="mt-1 text-[12px] text-sa-muted">
                      {formatUsd(product.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-2 border-b-[1.5px] border-terra pb-1 text-[12px] font-semibold text-sa-primary"
                    onClick={() =>
                      addToCart({
                        productId: product.id,
                        variantId: product.id,
                        slug: product.slug,
                        title: product.name,
                        imageUrl: product.image,
                        unitPrice: product.price,
                        currency: "USD",
                        notes: product.family
                          .split(/[·,]/)
                          .map((n) => n.trim())
                          .filter(Boolean),
                      })
                    }
                  >
                    Add
                    <Image
                      src={cartAssets.addArrow}
                      alt=""
                      width={15}
                      height={7}
                      className="h-[7px] w-[14.5px] dark:invert dark:sepia dark:saturate-0"
                      unoptimized
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-sa-border" />
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-section-soft p-8">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[14px] leading-normal">
              <span className="text-sa-muted">Subtotal</span>
              <span className="font-semibold text-sa-primary">
                {formatUsd(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[14px] leading-normal">
              <span className="text-sa-muted">Shipping</span>
              <span className="font-semibold text-[#4e8c6f]">Free</span>
            </div>
            <div className="my-1.5 border-t border-dashed border-sa-border" />
            <div className="flex justify-between pt-1 font-sans text-[20px] font-bold leading-tight text-sa-primary">
              <span>Total</span>
              <span>{formatUsd(subtotal)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border border-sa-input bg-page p-3">
            <Image
              src={cartAssets.truck}
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0"
              unoptimized
            />
            <p className="text-[12px] leading-normal text-sa-muted">
              Free shipping on orders over{" "}
              <span className="font-bold text-sa-primary">
                ${FREE_SHIPPING_THRESHOLD}
              </span>
            </p>
          </div>

          <Link
            href="/checkout"
            onClick={close}
            className="mt-4 flex h-10 w-full items-center justify-center bg-terra text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48]"
          >
            Checkout
          </Link>

          <button
            type="button"
            onClick={close}
            className="mt-4 w-full text-center text-[12px] font-semibold text-sa-muted"
          >
            or{" "}
            <span className="underline decoration-solid text-sa-primary">
              Continue Shopping
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
