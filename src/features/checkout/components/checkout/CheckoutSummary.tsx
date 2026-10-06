"use client";

import { EarnPreviewNote } from "@/features/loyalty/components/EarnPreviewNote";
import type { LoyaltyEarnPreviewView } from "@/features/loyalty/types/loyalty";
import { CheckoutAddonRow } from "@/features/cart/components/MissThisSwiper";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { CATALOG_PRODUCTS } from "@/features/catalog/constants/catalogProducts";
import {
  AppliedCampaigns,
  CouponForm,
  GiftCardForm,
  GiftWithPurchase,
  MoneySummary,
  PromoLinePrice,
  PromotionProgressRail,
  awardedGiftLines,
  giftDisplayName,
  setBundleLineLabel,
  visibleGiftCards,
  type PromotionSnapshotV1,
} from "@/features/promotions";
import { showsDistinctSize } from "@/features/cart/utils/showsDistinctSize";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import {
  checkoutAddons,
  checkoutAddonsTitle,
  checkoutBadges,
  checkoutLines,
  checkoutNote,
  checkoutSummary,
  checkoutSummaryNote,
  checkoutSummaryOpen,
  checkoutTotals,
  coline,
  colineBody,
  colineMedia,
  colineMeta,
  colineName,
  colineNote,
  colinePrice,
  colineTop,
} from "@/styles/checkoutChrome";
import type { CheckoutSessionResponse } from "../../types/checkout";

function lineImageUrl(slug: string, fallback?: string) {
  return CATALOG_PRODUCTS.find((product) => product.slug === slug)?.imageUrl ?? fallback;
}

type CheckoutSummaryProps = {
  open: boolean;
  orderableLines: CartLine[];
  leftOutCount: number;
  subtotal: number;
  promoSnapshot: PromotionSnapshotV1 | null;
  currency: string;
  addOns: CatalogProduct[];
  onAdd: (product: CatalogProduct) => void;
  canAdd: (product: CatalogProduct) => boolean;
  session: CheckoutSessionResponse | null | undefined;
  onCheckoutSession: (session: CheckoutSessionResponse) => void | Promise<void>;
  discount: number;
  shippingFee: number;
  shipDiscount: number;
  tax: number;
  total: number;
  amountPayable: number | null;
  giftCards: ReturnType<typeof visibleGiftCards>;
  warnings: string[];
  earnPreview?: LoyaltyEarnPreviewView | null;
};

export function CheckoutSummary({
  open,
  orderableLines,
  leftOutCount,
  subtotal,
  promoSnapshot,
  currency,
  addOns,
  onAdd,
  canAdd,
  session,
  onCheckoutSession,
  discount,
  shippingFee,
  shipDiscount,
  tax,
  total,
  amountPayable,
  giftCards,
  warnings,
  earnPreview,
}: CheckoutSummaryProps) {
  const cartPromotions = useCartStore((state) => state.promotions);

  return (
    <aside
      className={`${checkoutSummary} ${open ? checkoutSummaryOpen : ""}`}
      id="checkout-summary"
      aria-label="Order summary"
    >
      <h2>Your order</h2>
      {subtotal > 0 ? <PromotionProgressRail surface="checkout" /> : null}
      <div className={checkoutLines} id="checkout-lines">
        {orderableLines.map((line) => {
          const thumb = lineImageUrl(line.slug, line.imageUrl);
          const bundle =
            setBundleLineLabel(cartPromotions, line) ?? setBundleLineLabel(promoSnapshot, line);
          return (
            <article className={coline} key={line.cartItemId ?? line.variantId}>
              <div className={colineMedia}>
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : null}
                <b>{line.quantity}</b>
              </div>
              <div className={colineBody}>
                <div className={colineTop}>
                  <h3 className={colineName}>{line.title}</h3>
                  <PromoLinePrice
                    className={colinePrice}
                    snapshot={promoSnapshot}
                    fallbackSnapshot={cartPromotions}
                    line={line}
                  />
                </div>
                {showsDistinctSize(line.title, line.sizeLabel) ? (
                  <p className={colineMeta}>{line.sizeLabel}</p>
                ) : null}
                {bundle ? <p className={colineNote}>{bundle}</p> : null}
              </div>
            </article>
          );
        })}
        <GiftWithPurchase snapshot={promoSnapshot} currency={currency} selectable={false} />
      </div>
      {leftOutCount > 0 ? (
        <p className={`${checkoutNote} ${checkoutSummaryNote}`}>
          {leftOutCount === 1 ? "1 item" : `${leftOutCount} items`} in your bag can’t be ordered online and won’t be
          included.
        </p>
      ) : null}
      {addOns.length ? (
        <div className={checkoutAddons}>
          <h3 className={checkoutAddonsTitle}>Add-ons</h3>
          {addOns.map((product) => (
            <CheckoutAddonRow
              key={product.id}
              product={product}
              adding={false}
              onAdd={onAdd}
              disabled={!canAdd(product)}
            />
          ))}
        </div>
      ) : null}
      <AppliedCampaigns snapshot={promoSnapshot} />
      <CouponForm />
      <GiftCardForm
        snapshot={promoSnapshot}
        extraGiftCards={session?.giftCards}
        checkoutSessionId={session?.checkoutSessionId}
        onCheckoutSession={onCheckoutSession}
      />
      <MoneySummary
        className={checkoutTotals}
        surface="checkout"
        currency={currency}
        subtotal={subtotal}
        discount={discount}
        shipping={shippingFee}
        shippingDiscount={shipDiscount}
        tax={tax}
        total={total}
        amountPayable={amountPayable}
        giftCards={giftCards}
        freeGifts={awardedGiftLines(promoSnapshot).map((gift) => ({
          name: giftDisplayName(gift),
          quantity: gift.quantity,
        }))}
      />
      {earnPreview ? <EarnPreviewNote preview={earnPreview} variant="block" /> : null}
      {warnings.map((warning) => (
        <p className={`${checkoutNote} ${checkoutSummaryNote}`} key={warning} role="status">
          {warning}
        </p>
      ))}
      <p className={checkoutBadges}>SSL Encrypted · 30-day guarantee · Ships from Sharjah</p>
    </aside>
  );
}
