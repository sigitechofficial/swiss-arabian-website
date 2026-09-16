"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { MERCH_RAIL_SLUGS, useMerchRail } from "@/features/merchandising";
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
import { CouponForm, AppliedCampaigns, GiftCardForm, MoneySummary, PromotionUnlockNote, amountPayableFrom, shippingDiscountAmount, visibleGiftCards } from "@/features/promotions";
import { MissThisSwiper } from "./MissThisSwiper";

/** Matches the `v5/cart.html` prototype's `SHIP_FLAT` when the API has no totals yet. */
const SHIP_FLAT = 25;

function itemsLabel(n: number) {
  return n === 1 ? "1 item" : `${n} items`;
}

function lineImageUrl(slug: string, fallback?: string) {
  return CATALOG_PRODUCTS.find((p) => p.slug === slug)?.imageUrl ?? fallback;
}

function sizeLabelFor(product: CatalogProduct) {
  const concentration = product.concentration
    ? CONCENTRATION_LABELS[product.concentration]
    : "Fragrance";
  return `${concentration} · 50 ml`;
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

  const promotions = useCartStore((s) => s.promotions);
  const currency = totals?.currency ?? promotions?.context.currencyCode ?? "AED";
  const isEmpty = lines.length === 0;

  const shipping = totals ? totals.shipping : subtotal === 0 ? 0 : SHIP_FLAT;
  const discount = totals?.discount ?? 0;
  const shipDiscount = shippingDiscountAmount(promotions);
  const giftCards = visibleGiftCards(promotions);
  const amountPayable = amountPayableFrom(promotions, [
    totals?.amountPayable != null ? String(totals.amountPayable) : null,
  ]);
  const total = totals ? totals.total : subtotal + shipping;

  const missThis = useMerchRail(MERCH_RAIL_SLUGS.checkoutDontMiss).slice(0, 4);

  // Instant: the line lands in the bag now; the API sync runs behind.
  function addFromCart(product: CatalogProduct) {
    if (!product.sku && !product.variantId) return;
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
              Review your selections before checkout.
            </p>
          </header>

          <PromotionUnlockNote />

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
                <AppliedCampaigns />
                <CouponForm />
                <GiftCardForm />
                <MoneySummary
                  className="cart-totals"
                  currency={currency}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  shippingDiscount={shipDiscount}
                  total={total}
                  amountPayable={amountPayable}
                  giftCards={giftCards}
                />
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
                  <span className="cart-cta__glyph" aria-hidden="true">
                    ↗
                  </span>
                </button>
                <Link className="btn-secondary cart-continue" href="/products">
                  Continue shopping
                </Link>
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
