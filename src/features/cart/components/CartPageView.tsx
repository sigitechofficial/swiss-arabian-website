"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  CATALOG_PRODUCTS,
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";
import { useCartStore } from "@/stores/useCartStore";
import { COMPLIMENTARY_SAMPLES } from "../constants/complimentarySamples";
import { useCartMutations } from "../hooks/useCartMutations";
import {
  addItemOptimistic,
  removeItemOptimistic,
  setQuantityOptimistic,
} from "../api/optimisticCart";
import {
  PRICE_CHANGED,
  cartErrorMessage,
} from "../constants/validationMessages";
import { MissThisSwiper } from "./MissThisSwiper";

/** Matches the `v5/cart.html` prototype's `FREE` / `SHIP_FLAT` constants. */
const FREE_SHIPPING_THRESHOLD = 250;
const SHIP_FLAT = 25;

function itemsLabel(n: number) {
  return n === 1 ? "1 item" : `${n} items`;
}

function lineImageUrl(slug: string, fallback?: string) {
  return CATALOG_PRODUCTS.find((p) => p.slug === slug)?.imageUrl ?? fallback;
}

function sizeLabelFor(product: CatalogProduct) {
  return `${CONCENTRATION_LABELS[product.concentration]} · 50 ml`;
}

export function CartPageView() {
  const persistedLines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const cartId = useCartStore((s) => s.cartId);
  const persistedSubtotal = useCartStore((s) => s.subtotal());
  const persistedItemCount = useCartStore((s) => s.itemCount());
  const { validate } = useCartMutations();
  const syncing = useCartStore((s) => s.syncing);
  const validation = useCartStore((s) => s.validation);
  const addLocalLine = useCartStore((s) => s.addLine);
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const removeLocalLine = useCartStore((s) => s.removeLine);
  const router = useRouter();

  const blockingErrors = validation?.isValid === false ? validation.errors : [];
  const priceChanged = Boolean(
    validation?.warnings?.some((w) => w.type === PRICE_CHANGED),
  );

  /**
   * Guide: always re-validate before checkout, and block the button when the
   * cart comes back invalid rather than letting checkout fail later.
   */
  async function goToCheckout() {
    if (!cartId) {
      router.push("/checkout");
      return;
    }
    try {
      const cart = await validate.mutateAsync(cartId);
      if (cart.validation && cart.validation.isValid === false) return;
      router.push("/checkout");
    } catch {
      /* `useCartMutations` already surfaces the API error. */
    }
  }

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

  const missThis = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.slug).filter(Boolean));
    return CATALOG_PRODUCTS.filter((p) => !inCart.has(p.slug)).slice(0, 4);
  }, [lines]);

  // Instant: the line lands in the bag now; the API sync runs behind.
  function addFromCart(product: CatalogProduct) {
    if (product.sku || product.variantId) {
      addItemOptimistic({
        sku: product.sku,
        variantId: product.variantId,
        quantity: 1,
        line: {
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl ?? undefined,
          unitPrice: product.price ?? 0,
          currency: product.currency,
          sizeLabel: sizeLabelFor(product),
        },
      });
    } else {
      addLocalLine({
        variantId: product.slug,
        slug: product.slug,
        title: product.title,
        imageUrl: product.imageUrl ?? undefined,
        unitPrice: product.price ?? 0,
        currency: product.currency,
        quantity: 1,
        sizeLabel: sizeLabelFor(product),
      });
    }
  }

  return (
    <div className="landing">
      <section className="collection-head cart-head-section" aria-labelledby="cart-heading">
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
                {missThis.length ? (
                  <div className="cart-miss">
                    <MissThisSwiper
                      products={missThis}
                      addingSlug={null}
                      onAdd={(p) => addFromCart(p)}
                    />
                  </div>
                ) : null}

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
                              if (line.remote || line.cartItemId) {
                                setQuantityOptimistic(line.variantId, next);
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
                              if (line.remote || line.cartItemId) {
                                setQuantityOptimistic(line.variantId, next);
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
                            if (line.remote || line.cartItemId) {
                              removeItemOptimistic(line.variantId);
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

                {COMPLIMENTARY_SAMPLES.map((sample) => {
                  const thumb = lineImageUrl(sample.slug);
                  return (
                    <article className="cline cline--gift" key={`gift-${sample.slug}`}>
                      <div className="cline__media">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" />
                        ) : null}
                      </div>
                      <div className="cline__body">
                        <div className="cline__row">
                          <h3>{sample.title}</h3>
                          <span className="cline__price cline__price--gift" dir="ltr">
                            <s>{formatMoney(sample.value, currency)}</s>
                            <strong>Free</strong>
                          </span>
                        </div>
                        <p className="cline__meta">{sample.sizeLabel}</p>
                        <p className="cline__gift-tag">Selected free sample (−{formatMoney(sample.value, currency)})</p>
                      </div>
                    </article>
                  );
                })}
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
                {priceChanged ? (
                  <p className="cart-hint" role="status">
                    Prices have been updated since you added these items.
                  </p>
                ) : null}
                {blockingErrors.length ? (
                  <ul className="cart-hint" role="alert">
                    {blockingErrors.map((issue, index) => (
                      <li key={`${issue.type}-${issue.cartItemId ?? index}`}>
                        {cartErrorMessage(issue.type, issue.message)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  className="cart-cta"
                  onClick={goToCheckout}
                  disabled={syncing || validate.isPending || blockingErrors.length > 0}
                >
                  <span>
                    {syncing
                      ? "Updating bag…"
                      : validate.isPending
                        ? "Checking availability…"
                        : "Proceed to checkout"}
                  </span>
                  <b className="arrow" aria-hidden="true">
                    ↗
                  </b>
                </button>
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
