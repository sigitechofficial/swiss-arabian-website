"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import { useCartMutations } from "../hooks/useCartMutations";

/** Matches the `v5/cart.html` prototype's `FREE` / `SHIP_FLAT` constants. */
const FREE_SHIPPING_THRESHOLD = 250;
const SHIP_FLAT = 25;

function itemsLabel(n: number) {
  return n === 1 ? "1 item" : `${n} items`;
}

export function CartPageView() {
  const persistedLines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const cartId = useCartStore((s) => s.cartId);
  const persistedSubtotal = useCartStore((s) => s.subtotal());
  const persistedItemCount = useCartStore((s) => s.itemCount());
  const { update, remove } = useCartMutations();
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const removeLocalLine = useCartStore((s) => s.removeLine);

  // The cart is persisted to localStorage, invisible to the server — so the
  // very first client render must still report an empty bag (matching SSR)
  // and only pick up the real, rehydrated cart once mounted. See the same
  // guard in `SiteHeader`'s bag-count badge.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const lines = mounted ? persistedLines : [];
  const subtotal = mounted ? persistedSubtotal : 0;
  const itemCount = mounted ? persistedItemCount : 0;

  const currency = totals?.currency ?? "AED";
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const isFree = subtotal > 0 && remaining <= 0;
  const isEmpty = lines.length === 0;

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIP_FLAT;
  const total = subtotal + shipping;

  return (
    <div className="landing">
      <section className="collection-head" aria-labelledby="cart-heading">
        <div className="container container--full">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol className="crumbs__list" role="list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">Bag</li>
            </ol>
          </nav>

          <header className="cart-page-head">
            <p className="collection-head__eyebrow">
              Your bag · <span>{itemsLabel(itemCount)}</span>
            </p>
            <h1 className="collection-head__title" id="cart-heading">
              The <em className="collection-head__em">bag.</em>
            </h1>
            <p className="collection-head__intro cart-page-lede">
              Review your selections before checkout. Free samples arrive with every order — chosen to match your
              notes.
            </p>
          </header>

          <div className={`cart-ship-banner ${isFree ? "is-free" : ""}`} aria-live="polite">
            <p>
              {subtotal === 0
                ? ""
                : isFree
                  ? "You qualify for free shipping!"
                  : `Spend ${formatMoney(remaining, currency)} more for free shipping.`}
            </p>
            <div className="cart-ship-track">
              <div className="cart-ship-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {!isEmpty ? (
            <div className="cart-layout" id="cart-page-layout">
              <div className="cart-items-col" aria-live="polite">
                {lines.map((line) => (
                  <article className="cline" key={line.cartItemId ?? line.variantId}>
                    <Link className="cline__media" href={line.slug ? `/products/${line.slug}` : "#"}>
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.imageUrl} alt="" />
                      ) : null}
                    </Link>
                    <div className="cline__body">
                      <div className="cline__row">
                        <h3>
                          <Link href={line.slug ? `/products/${line.slug}` : "#"}>{line.title}</Link>
                        </h3>
                        <span className="cline__price" dir="ltr">
                          {formatMoney(line.unitPrice * line.quantity, line.currency)}
                        </span>
                      </div>
                      {line.sizeLabel ? <p className="cline__meta">{line.sizeLabel}</p> : null}
                      <div className="cline__actions">
                        <span className="cline__qty">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => {
                              const next = Math.max(1, line.quantity - 1);
                              if (line.cartItemId && cartId) {
                                void update.mutateAsync({ cartItemId: line.cartItemId, cartId, quantity: next });
                              } else {
                                updateLocalQuantity(line.variantId, next);
                              }
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span dir="ltr">{line.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => {
                              const next = line.quantity + 1;
                              if (line.cartItemId && cartId) {
                                void update.mutateAsync({ cartItemId: line.cartItemId, cartId, quantity: next });
                              } else {
                                updateLocalQuantity(line.variantId, next);
                              }
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </span>
                        <button
                          type="button"
                          className="cline__remove"
                          onClick={() => {
                            if (line.cartItemId && cartId) {
                              void remove.mutateAsync({ cartItemId: line.cartItemId, cartId });
                            } else {
                              removeLocalLine(line.variantId);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="cart-summary" aria-label="Order summary">
                <h2>Summary</h2>
                <dl className="cart-totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd dir="ltr">{formatMoney(subtotal, currency)}</dd>
                  </div>
                  <div>
                    <dt>Shipping</dt>
                    <dd dir="ltr">{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd>
                  </div>
                  <div className="cart-totals-line">
                    <dt>Total</dt>
                    <dd dir="ltr">{formatMoney(total, currency)}</dd>
                  </div>
                </dl>
                <Link className="cart-cta" href="/checkout">
                  <span>Proceed to checkout</span>
                  <b className="arrow" aria-hidden="true">
                    ↗
                  </b>
                </Link>
                <Link className="btn-secondary cart-continue" href="/products">
                  Continue shopping
                </Link>
                <p className="cart-hint">
                  Complimentary shipping on orders over <strong>{formatMoney(FREE_SHIPPING_THRESHOLD, currency)}</strong>.
                </p>
                <p className="cart-hint">30-day fragrance guarantee. Returns are on us.</p>
                <div className="cart-badges">
                  <span>SSL Secured</span>
                  <i aria-hidden="true">·</i>
                  <span>Ships from Sharjah</span>
                </div>
              </aside>
            </div>
          ) : (
            <section className="cart-empty-state">
              <p className="collection-head__eyebrow">Nothing yet</p>
              <h2 className="collection-head__title">
                Your bag is <em className="collection-head__em">empty.</em>
              </h2>
              <p className="collection-head__intro">
                Every scent is composed in small lots. Start with a signature.
              </p>
              <Link className="cart-cta cart-cta--inline" href="/products">
                <span>Explore the collection</span>
                <b className="arrow" aria-hidden="true">
                  ↗
                </b>
              </Link>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
