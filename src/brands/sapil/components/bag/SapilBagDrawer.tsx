"use client";

import { useCallback } from "react";
import { useBag } from "@/features/cart/hooks/useBag";
import { freeDeliveryProgress, useMarketDelivery } from "@/features/markets/hooks/useMarketDelivery";
import { useFreeShippingBar } from "@/features/promotions";
import { useApplicablePromotions } from "@/features/promotions/hooks/useApplicablePromotions";
import { useGiftAwards } from "@/features/promotions/hooks/useGiftAwards";
import { useHydrated } from "@/hooks/useHydrated";
import { useLoyaltyRedemption } from "@/features/loyalty/hooks/useLoyaltyRedemption";
import { formatPoints } from "@/features/loyalty/types/loyalty";
import { brandFeatureEnabled } from "@/lib/brand/features";
import { useUiStore } from "@/stores/useUiStore";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink, useSapilMoney } from "../commerce/shared";
import { toBagGiftData, toBagLineData, toFreeDelivery } from "./bagData";
import { SapilBagDrawerView } from "./SapilBagDrawerView";

/**
 * Sapil's bag drawer (v9 `.drawer`). Rendered once by the Sapil shell; opens
 * when the cart store's `cartOpen` is set (add to bag, header bag button).
 * Lines, totals, free-delivery progress, promotions and gifts all come from
 * the cart and promotions APIs through the shared hooks.
 */
export function SapilBagDrawer() {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const hydrated = useHydrated();
  const open = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const close = useCallback(() => setCartOpen(false), [setCartOpen]);
  const bag = useBag();
  const ship = useFreeShippingBar();
  const progress = useApplicablePromotions().data?.progress;
  const { views: giftViews } = useGiftAwards(null, bag.currency);
  const points = useLoyaltyRedemption();

  // The points editor lives on the bag page; the drawer says what is used, or links there.
  const pointsQuote = !brandFeatureEnabled("loyalty") || points.hidden ? null : points.quote;
  const pointsNote = !pointsQuote ? undefined : pointsQuote.appliedPoints > 0 ? (
    <>
      {t("bag.pointsUsing", { points: formatPoints(pointsQuote.appliedPoints) })}
      {pointsQuote.appliedAmount > 0 ? ` (−${money(pointsQuote.appliedAmount, pointsQuote.currencyCode || bag.currency)})` : ""}
      {" · "}
      <SapilLink href="/cart" onClick={close} className="underline underline-offset-[3px]">
        {t("bag.pointsChange")}
      </SapilLink>
    </>
  ) : pointsQuote.enabled && pointsQuote.eligible ? (
    <SapilLink href="/cart" onClick={close} className="underline underline-offset-[3px]">
      {t("bag.pointsUse", { points: formatPoints(pointsQuote.availablePoints) })}
    </SapilLink>
  ) : undefined;

  // The bag lives in browser storage: the first render matches the server (empty).
  const lines = hydrated ? bag.orderedLines : [];
  const lineData = toBagLineData({ lines, promotions: bag.promotions, bundleLabel: bag.bundleLabel, money, t });
  const byKey = new Map(lines.map((line) => [line.cartItemId ?? line.variantId, line]));

  const discount = bag.totals?.discount ?? 0;
  const shipping = bag.totals?.shipping ?? 0;
  const subtotalNet = Math.max(0, bag.subtotal - discount);
  // Free delivery: the market's threshold (GET /storefront/markets → delivery), else a
  // free-shipping promotion's. Checkout's delivery methods stay the authority on the fee.
  const market = useMarketDelivery();
  const marketFree = freeDeliveryProgress(market.freeDeliveryThreshold, subtotalNet);
  const freeCurrency = market.currency ?? bag.currency;
  const unlocked = ship.unlocked || Boolean(marketFree?.reached);

  return (
    <SapilBagDrawerView
      open={open}
      onClose={close}
      count={hydrated ? bag.itemCount : 0}
      freeDelivery={toFreeDelivery(
        marketFree
          ? {
              empty: lines.length === 0,
              threshold: marketFree.threshold,
              unlocked,
              progress: marketFree.progress,
              remaining: marketFree.remaining,
              currency: freeCurrency,
              money,
            }
          : {
              empty: lines.length === 0,
              threshold: ship.threshold,
              unlocked: ship.unlocked,
              progress: ship.progress,
              remaining: ship.remaining,
              currency: ship.currency,
              money,
            },
      )}
      lines={lineData}
      gifts={lines.length ? toBagGiftData(giftViews, money) : []}
      onQuantityChange={(key, quantity) => {
        const line = byKey.get(key);
        if (line) bag.setLineQuantity(line, quantity);
      }}
      onRemove={(key) => {
        const line = byKey.get(key);
        if (line) bag.removeLine(line);
      }}
      subtotal={bag.quotePending ? t("bag.updating") : money(subtotalNet, bag.currency)}
      subtotalWas={!bag.quotePending && discount > 0 ? money(bag.subtotal, bag.currency) : undefined}
      delivery={
        unlocked
          ? t("bag.deliveryFree")
          : shipping > 0
            ? money(shipping, bag.currency)
            : t("bag.deliveryAtCheckout")
      }
      total={
        bag.allUnavailable
          ? t("bag.unavailable")
          : bag.amountDue == null
            ? t("bag.updating")
            : money(bag.amountDue, bag.currency)
      }
      promoNote={progress?.primary?.message ?? progress?.unlockedSummary ?? undefined}
      pointsNote={pointsNote}
      checkoutHref="/checkout"
      checkoutBlocked={bag.checkoutBlocked}
      syncing={bag.syncing}
      shopHref="/products"
      LinkComponent={SapilLink}
    />
  );
}
