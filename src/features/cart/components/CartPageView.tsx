"use client";

import { useRef, useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { MERCH_RAIL_SLUGS, useMerchRail } from "@/features/merchandising";
import {
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";
import { StaffDiscountSummary } from "@/features/employeeBenefits/components/StaffDiscountSummary";
import { EarnPreviewNote } from "@/features/loyalty/components/EarnPreviewNote";
import { LoyaltyRedemptionEditor } from "@/features/loyalty/components/LoyaltyRedemptionEditor";
import { useEarnPreview } from "@/features/loyalty/hooks/useEarnPreview";
import { loyaltyLineFromQuote } from "@/features/loyalty/hooks/useLoyaltyRedemption";
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
  cartQtyLimit,
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
import { atStockLimit, stockLimitNote } from "../utils/stockLimit";
import { addItemOptimistic } from "../api/optimisticCart";
import { useBagPage } from "../hooks/useBagPage";
import { bundleTags } from "../utils/bundleTags";
import { cartErrorMessage } from "../constants/validationMessages";
import {
  CouponForm,
  AppliedCampaigns,
  EmptyBagRecovery,
  GiftCardForm,
  GiftWithPurchase,
  MoneySummary,
  PromoLinePrice,
  PromotionProgressRail,
  PromotionQuickAdd,
} from "@/features/promotions";
import { MissThisSwiper } from "./MissThisSwiper";
import { CartTabbyPromo } from "./CartTabbyPromo";
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
  const {
    totals,
    orderedLines,
    bundleLabel,
    setLineQuantity,
    removeLine,
    isEmpty,
    itemCount,
    subtotal,
    currency,
    promotions,
    employeeCheckout,
    loyaltyRedemption,
    cartId,
    syncing,
    quotePending,
    discount,
    shipDiscount,
    shipping,
    giftCards,
    total,
    amountPayable,
    blockingErrors,
    priceChanged,
    validating,
    checkoutDisabled,
    goToCheckout,
  } = useBagPage();
  const earnPreview = useEarnPreview({ cartId });

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
      banner.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      return 550;
    },
    onFire: () => setLinesFlash(true),
    onClear: () => setLinesFlash(false),
  });

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
            {!isEmpty ? (
              <span className={cartPageCount}>{itemsLabel(itemCount)}</span>
            ) : null}
          </header>

          {!isEmpty ? (
            <div className={cartLayout} id="cart-page-layout">
              <div
                className={cartItemsCol}
                aria-live="polite"
                ref={itemsColRef}
              >
                <div
                  className={confettiLayer}
                  ref={confettiLayerRef}
                  aria-hidden="true"
                >
                  <PopperBurstLayer burst={popperBurst} />
                </div>
                <div
                  className={`${cartLinesCard} ${linesFlash ? drawerPanelFlash : ""}`}
                >
                  {orderedLines.map((line) => {
                    const bundle = bundleLabel(line);
                    return (
                      <article
                        className={cartRow}
                        key={line.cartItemId ?? line.variantId}
                      >
                        <LocaleLink
                          className={cartRowMedia}
                          href={line.slug ? `/products/${line.slug}` : "#"}
                        >
                          {line.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={line.imageUrl} alt="" />
                          ) : null}
                        </LocaleLink>
                        <div className={cartRowBody}>
                          <div className={cartRowTop}>
                            <h3 className={cartRowName}>
                              <LocaleLink
                                href={
                                  line.slug ? `/products/${line.slug}` : "#"
                                }
                              >
                                {line.title}
                              </LocaleLink>
                            </h3>
                            {line.isSellable === false ? (
                              <p className={cartRowPrice}>Unavailable</p>
                            ) : (
                              <PromoLinePrice
                                className={cartRowPrice}
                                snapshot={promotions}
                                line={line}
                              />
                            )}
                          </div>
                          {showsDistinctSize(line.title, line.sizeLabel) ? (
                            <p className={cartRowMeta}>{line.sizeLabel}</p>
                          ) : null}
                          {bundle ? (
                            <p className={cartRowTags}>
                              {bundleTags(bundle).map((tag) => (
                                <span
                                  className={
                                    tag.strong
                                      ? drawerLineTagStrong
                                      : drawerLineTag
                                  }
                                  key={tag.text}
                                >
                                  {tag.text}
                                </span>
                              ))}
                            </p>
                          ) : null}
                          <div className={cartRowActions}>
                            <span className={cartRowQty}>
                              <button
                                type="button"
                                aria-label="Decrease"
                                disabled={line.isSellable === false}
                                onClick={() =>
                                  setLineQuantity(
                                    line,
                                    Math.max(1, line.quantity - 1),
                                  )
                                }
                              >
                                <Minus size={13} />
                              </button>
                              <span dir="ltr">{line.quantity}</span>
                              <button
                                type="button"
                                aria-label="Increase"
                                disabled={
                                  line.isSellable === false ||
                                  atStockLimit(line)
                                }
                                onClick={() =>
                                  setLineQuantity(line, line.quantity + 1)
                                }
                              >
                                <Plus size={13} />
                              </button>
                            </span>
                            <button
                              type="button"
                              className={cartRowRemove}
                              onClick={() => removeLine(line)}
                            >
                              Remove
                            </button>
                          </div>
                          {atStockLimit(line) && line.maxQuantity != null ? (
                            <p className={cartQtyLimit} role="status">
                              {stockLimitNote(line.maxQuantity)}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {quotePending ? null : (
                    <GiftWithPurchase
                      snapshot={promotions}
                      currency={currency}
                      surface="drawer"
                    />
                  )}
                  <PromotionProgressRail surface="cart" />
                </div>

                {missThis.length ? (
                  <MissThisSwiper
                    products={missThis}
                    addingSlug={null}
                    onAdd={(p) => addFromCart(p)}
                  />
                ) : null}
                <PromotionQuickAdd surface="cart" />
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
                <StaffDiscountSummary
                  checkout={employeeCheckout}
                  currency={currency}
                />
                {quotePending ? null : (
                  <MoneySummary
                    className={cartTotals}
                    currency={currency}
                    subtotal={subtotal}
                    discount={discount}
                    shipping={shipping}
                    shippingDiscount={shipDiscount}
                    tax={totals?.tax ?? 0}
                    taxLabel={totals?.taxLabel}
                    taxIncluded={totals?.taxIncluded}
                    total={total}
                    amountPayable={amountPayable}
                    loyalty={loyaltyLineFromQuote(loyaltyRedemption)}
                    giftCards={giftCards}
                  />
                )}
                {quotePending ? null : (
                  <CartTabbyPromo amount={amountPayable ?? total} currency={currency} />
                )}
                {quotePending ? null : (
                  <EarnPreviewNote
                    preview={earnPreview.preview}
                    variant="block"
                    showBasis
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
                  disabled={checkoutDisabled}
                >
                  <span>
                    {syncing
                      ? "Updating bag…"
                      : validating
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
                {/* Returns and shipping terms are the market's own policies,
                    linked from the footer: no fixed promises here. */}
                <div className={cartBadges}>
                  <span>SSL Secured</span>
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
                <p className={drawerEmptyCopy}>
                  Explore our fragrances, or pick up where you left off below.
                </p>
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
