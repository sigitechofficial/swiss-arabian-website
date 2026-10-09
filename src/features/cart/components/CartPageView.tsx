"use client";

import { useEffect, useRef, useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { MERCH_RAIL_SLUGS, useMerchRail } from "@/features/merchandising";
import {
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";
import { EarnPreviewNote } from "@/features/loyalty/components/EarnPreviewNote";
import { LoyaltyRedemptionEditor } from "@/features/loyalty/components/LoyaltyRedemptionEditor";
import { useEarnPreview } from "@/features/loyalty/hooks/useEarnPreview";
import { loyaltyLineFromQuote } from "@/features/loyalty/hooks/useLoyaltyRedemption";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  cartCrumbs,
  cartCrumbsList,
  collectionHeadFlush,
  pageTitle,
} from "@/styles/shopChrome";
import { pageContainer } from "@/styles/siteChrome";
import {
  cartBadges,
  cartContinue,
  cartCta,
  cartCtaGlyph,
  cartEmptyHero,
  cartEmptyRails,
  cartEmptyState,
  cartHint,
  cartItemsCol,
  cartLayout,
  cartLinesCard,
  cartPageCount,
  cartPageHead,
  cartRow,
  cartRowActions,
  cartRowBody,
  cartRowMedia,
  cartRowMeta,
  cartRowName,
  cartRowPrice,
  cartRowRemove,
  cartRowTags,
  cartRowTop,
  cartSummary,
  cartSummaryTitle,
  cartTotals,
  cartRowQty,
  confettiLayer,
  drawerPanelFlash,
  drawerEmptyCopy,
  drawerEmptyCta,
  drawerEmptyIcon,
  drawerEmptyTitle,
  drawerLineTag,
  drawerLineTagStrong,
} from "@/styles/cartChrome";
import { showsDistinctSize } from "../utils/showsDistinctSize";
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
import { CouponForm, AppliedCampaigns, EmptyBagRecovery, GiftCardForm, GiftWithPurchase, MoneySummary, PromoLinePrice, PromotionProgressRail, PromotionQuickAdd, amountPayableFrom, bundleLinesFirst, setBundleLineLabel, shippingDiscountAmount, visibleGiftCards } from "@/features/promotions";
import {
  quotedCartShipping,
  quotedCartTotal,
} from "../utils/insiderCartItem";
import { MissThisSwiper } from "./MissThisSwiper";
import { PopperBurstLayer, useBundleCelebration } from "./BundleCelebration";

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
  const earnPreview = useEarnPreview({ cartId });
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
  // Completing a bundle on this page: bring the "You saved" banner into view,
  // then the same party poppers + flash as the bag drawer. Skipped while the
  // drawer is open — it celebrates there instead.
  const drawerOpen = useUiStore((s) => s.cartOpen);
  const itemsColRef = useRef<HTMLDivElement>(null);
  const confettiLayerRef = useRef<HTMLDivElement>(null);
  const [linesFlash, setLinesFlash] = useState(false);
  const popperBurst = useBundleCelebration({
    rootRef: itemsColRef,
    layerRef: confettiLayerRef,
    enabled: !drawerOpen,
    beforeFire: (banner, reduceMotion) => {
      if (!banner) return 0;
      const box = banner.getBoundingClientRect();
      const inView = box.top >= 160 && box.bottom <= window.innerHeight - 40;
      if (inView) return 0;
      banner.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      return 550;
    },
    onFire: () => setLinesFlash(true),
    onClear: () => setLinesFlash(false),
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const lines = mounted ? persistedLines : [];
  const subtotal = mounted ? persistedSubtotal : 0;
  const itemCount = mounted ? persistedItemCount : 0;

  const promotions = useCartStore((s) => s.promotions);
  const loyaltyRedemption = useCartStore((s) => s.loyaltyRedemption);
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
                <LocaleLink href="/">Home</LocaleLink>
              </li>
              <li aria-current="page">Bag</li>
            </ol>
          </nav>

          <header className={cartPageHead}>
            <h1 className={pageTitle} id="cart-heading">
              Your bag
            </h1>
            {!isEmpty ? <span className={cartPageCount}>{itemsLabel(itemCount)}</span> : null}
          </header>

          {!isEmpty ? (
            <div className={cartLayout} id="cart-page-layout">
              <div className={cartItemsCol} aria-live="polite" ref={itemsColRef}>
                <div className={confettiLayer} ref={confettiLayerRef} aria-hidden="true">
                  <PopperBurstLayer burst={popperBurst} />
                </div>
                <div className={`${cartLinesCard} ${linesFlash ? drawerPanelFlash : ""}`}>
                  <PromotionProgressRail surface="cart" />
                  {bundleLinesFirst(lines, promotions).map((line) => {
                    const bundle = setBundleLineLabel(promotions, line);
                    return (
                  <article className={cartRow} key={line.cartItemId ?? line.variantId}>
                    <LocaleLink className={cartRowMedia} href={line.slug ? `/products/${line.slug}` : "#"}>
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.imageUrl} alt="" />
                      ) : null}
                    </LocaleLink>
                    <div className={cartRowBody}>
                      <div className={cartRowTop}>
                        <h3 className={cartRowName}>
                          <LocaleLink href={line.slug ? `/products/${line.slug}` : "#"}>{line.title}</LocaleLink>
                        </h3>
                        <PromoLinePrice className={cartRowPrice} snapshot={promotions} line={line} />
                      </div>
                      {showsDistinctSize(line.title, line.sizeLabel) ? (
                        <p className={cartRowMeta}>{line.sizeLabel}</p>
                      ) : null}
                      {bundle ? (
                        <p className={cartRowTags}>
                          {bundle
                            .split("·")
                            .map((part) => part.trim())
                            .filter(Boolean)
                            .map((part) => (
                              <span className={/%|off/i.test(part) ? drawerLineTagStrong : drawerLineTag} key={part}>
                                {part}
                              </span>
                            ))}
                        </p>
                      ) : null}
                      <div className={cartRowActions}>
                        <span className={cartRowQty}>
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
                          className={cartRowRemove}
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
                    );
                  })}
                  {quotePending ? null : (
                    <GiftWithPurchase snapshot={promotions} currency={currency} surface="drawer" />
                  )}
                </div>

                {missThis.length ? (
                  <MissThisSwiper
                    products={missThis}
                    addingSlug={null}
                    onAdd={(p) => addFromCart(p)}
                  />
                ) : null}
                {/* The rail carries the drawer's 22px gutter; pull it flush with the column (left only, so the rail still clips at the right edge). */}
                <div className="-ml-[22px]">
                  <PromotionQuickAdd surface="cart" />
                </div>
              </div>

              <aside className={cartSummary} aria-label="Order summary">
                <h2 className={cartSummaryTitle}>Order summary</h2>
                {quotePending ? (
                  <p className={cartHint} role="status">
                    Updating offers…
                  </p>
                ) : (
                  <AppliedCampaigns hideGifts />
                )}
                <CouponForm />
                {quotePending ? null : <LoyaltyRedemptionEditor />}
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
                  loyalty={loyaltyLineFromQuote(loyaltyRedemption)}
                  giftCards={giftCards}
                />
                )}
                {quotePending ? null : (
                  <EarnPreviewNote preview={earnPreview.preview} variant="block" showBasis />
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
                <LocaleLink className={cartContinue} href="/products">
                  Continue shopping
                </LocaleLink>
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
              <div className={cartEmptyHero}>
                <span className={drawerEmptyIcon} aria-hidden="true">
                  <ShoppingBag size={24} strokeWidth={1.6} />
                </span>
                <p className={drawerEmptyTitle}>Your bag is empty</p>
                <p className={drawerEmptyCopy}>Explore our fragrances, or pick up where you left off below.</p>
                <LocaleLink className={drawerEmptyCta} href="/products">
                  Shop fragrances
                </LocaleLink>
              </div>
              <div className={cartEmptyRails}>
                <EmptyBagRecovery surface="empty-cart" />
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
