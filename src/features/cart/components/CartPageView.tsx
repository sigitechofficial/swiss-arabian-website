"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { MERCH_RAIL_SLUGS, useMerchRail } from "@/features/merchandising";
import {
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";
import { useCartStore } from "@/stores/useCartStore";
import {
  cartCrumbs,
  cartCrumbsList,
  cartEm,
  cartEyebrow,
  cartLede,
  collectionHeadFlush,
  pageTitle,
} from "@/styles/shopChrome";
import { pageContainer } from "@/styles/siteChrome";
import {
  cartBadges,
  cartContinue,
  cartCta,
  cartCtaGlyph,
  cartCtaInline,
  cartEmptyNote,
  cartEmptyState,
  cartHint,
  cartItemsCol,
  cartLayout,
  cartMiss,
  cartPageHead,
  cartSummary,
  cartSummaryTitle,
  cartTotals,
  cline,
  clineActions,
  clineBody,
  clineMedia,
  clineMeta,
  clinePrice,
  clineQty,
  clineRemove,
  clineRow,
} from "@/styles/cartChrome";
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
import { CouponForm, AppliedCampaigns, EmptyBagRecovery, GiftCardForm, GiftWithPurchase, MoneySummary, PromoLinePrice, PromotionProgressRail, PromotionQuickAdd, amountPayableFrom, awardedGiftLines, giftDisplayName, setBundleLineLabel, shippingDiscountAmount, visibleGiftCards } from "@/features/promotions";
import {
  quotedCartShipping,
  quotedCartTotal,
} from "../utils/insiderCartItem";
import { MissThisSwiper } from "./MissThisSwiper";

function itemsLabel(n: number) {
  return n === 1 ? "1 item" : `${n} items`;
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
  const currency = totals?.currency ?? promotions?.context?.currencyCode ?? "AED";
  const isEmpty = lines.length === 0;

  const quotePending = syncing && totals == null;
  const shipping =
    !mounted || quotePending
      ? 0
      : quotedCartShipping(subtotal, totals?.shipping);
  const discount = totals?.discount ?? 0;
  const shipDiscount = shippingDiscountAmount(promotions);
  const giftCards = visibleGiftCards(promotions);
  const payable = amountPayableFrom(promotions, [
    totals?.amountPayable != null ? String(totals.amountPayable) : null,
  ]);
  const total =
    !mounted || quotePending
      ? subtotal
      : quotedCartTotal({
          merchandise: subtotal,
          quotedTotal: totals?.total,
          quotedShipping: totals?.shipping,
          shipping,
        });
  const extraShipping = totals ? Math.max(0, shipping - totals.shipping) : 0;
  const amountPayable =
    payable != null && extraShipping > 0 ? payable + extraShipping : payable;

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
    <div>
      <section className={collectionHeadFlush} aria-labelledby="cart-heading">
        <div className={pageContainer}>
          <nav className={cartCrumbs} aria-label="Breadcrumb">
            <ol className={cartCrumbsList} role="list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">Bag</li>
            </ol>
          </nav>

          <header className={cartPageHead}>
            <p className={cartEyebrow}>
              Your bag · <span>{itemsLabel(itemCount)}</span>
            </p>
            <h1 className={pageTitle} id="cart-heading">
              The <em className={cartEm}>bag.</em>
            </h1>
            <p className={cartLede}>
              Review your selections before checkout.
            </p>
          </header>

          {!isEmpty ? (
            <div className="grid gap-3">
              <PromotionProgressRail surface="cart" />
              <PromotionQuickAdd surface="cart" />
            </div>
          ) : null}

          {!isEmpty ? (
            <div className={cartLayout} id="cart-page-layout">
              <div className={cartItemsCol} aria-live="polite">
                {missThis.length ? (
                  <div className={cartMiss}>
                    <MissThisSwiper
                      products={missThis}
                      addingSlug={null}
                      onAdd={(p) => addFromCart(p)}
                    />
                  </div>
                ) : null}

                {lines.map((line) => (
                  <article className={cline} key={line.cartItemId ?? line.variantId}>
                    <Link className={clineMedia} href={line.slug ? `/products/${line.slug}` : "#"}>
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.imageUrl} alt="" />
                      ) : null}
                    </Link>
                    <div className={clineBody}>
                      <div className={clineRow}>
                        <h3>
                          <Link href={line.slug ? `/products/${line.slug}` : "#"}>{line.title}</Link>
                        </h3>
                        <PromoLinePrice className={clinePrice} snapshot={promotions} line={line} />
                      </div>
                      {line.sizeLabel ? <p className={clineMeta}>{line.sizeLabel}</p> : null}
                      {setBundleLineLabel(promotions, line) ? (
                        <p className={clineMeta}>{setBundleLineLabel(promotions, line)}</p>
                      ) : null}
                      <div className={clineActions}>
                        <span className={clineQty}>
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
                          className={clineRemove}
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

                {quotePending ? null : <GiftWithPurchase snapshot={promotions} currency={currency} />}
              </div>

              <aside className={cartSummary} aria-label="Order summary">
                <h2 className={cartSummaryTitle}>Summary</h2>
                {quotePending ? (
                  <p className={cartHint} role="status">
                    Updating offers…
                  </p>
                ) : (
                  <AppliedCampaigns />
                )}
                <CouponForm />
                <GiftCardForm />
                {quotePending ? null : (
                <MoneySummary
                  className={cartTotals}
                  currency={currency}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  shippingDiscount={shipDiscount}
                  total={total}
                  amountPayable={amountPayable}
                  giftCards={giftCards}
                  freeGifts={awardedGiftLines(promotions).map((gift) => ({
                    name: giftDisplayName(gift),
                    quantity: gift.quantity,
                  }))}
                />
                )}
                {priceChanged ? (
                  <p className={cartHint} role="status">
                    Prices have been updated since you added these items.
                  </p>
                ) : null}
                {blockingErrors.length ? (
                  <ul className={cartHint} role="alert">
                    {blockingErrors.map((issue, index) => (
                      <li key={`${issue.type}-${issue.cartItemId ?? index}`}>
                        {cartErrorMessage(issue.type, issue.message)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  className={cartCta}
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
                  <span className={cartCtaGlyph} aria-hidden="true">
                    ↗
                  </span>
                </button>
                <Link className={cartContinue} href="/products">
                  Continue shopping
                </Link>
                <p className={cartHint}>30-day fragrance guarantee. Returns are on us.</p>
                <div className={cartBadges}>
                  <span>SSL Secured</span>
                  <i aria-hidden="true">·</i>
                  <span>Ships from Sharjah</span>
                </div>
              </aside>
            </div>
          ) : (
            <section className={cartEmptyState}>
              <p className={cartEmptyNote}>Your bag is empty.</p>
              <EmptyBagRecovery surface="empty-cart" />
              <Link className={cartCtaInline} href="/products">
                <span>Explore the collection</span>
                <b aria-hidden="true">
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
