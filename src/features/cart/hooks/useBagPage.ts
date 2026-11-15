"use client";

import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import {
  amountPayableFrom,
  shippingDiscountAmount,
  useApplicablePromotions,
  visibleGiftCards,
} from "@/features/promotions";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/stores/useCartStore";
import { PRICE_CHANGED } from "../constants/validationMessages";
import { cartCurrency } from "../utils/cartCurrency";
import { quotedCartTotal } from "../utils/insiderCartItem";
import { useBag } from "./useBag";
import { useCartMutations } from "./useCartMutations";

/**
 * The bag page: the drawer's bag plus the full money summary (shipping,
 * discount, gift cards, amount payable) and the validated checkout step.
 * Persisted cart state is browser-only, so the first render reports an empty
 * bag (matching the server) until the store has rehydrated.
 */
export function useBagPage() {
  const bag = useBag();
  const totals = useCartStore((s) => s.totals);
  const cartId = useCartStore((s) => s.cartId);
  const persistedLines = useCartStore((s) => s.lines);
  const persistedSubtotal = useCartStore((s) => s.subtotal());
  const persistedItemCount = useCartStore((s) => s.itemCount());
  const validation = useCartStore((s) => s.validation);
  const promotions = useCartStore((s) => s.promotions);
  const employeeCheckout = useCartStore((s) => s.employeeCheckout);
  const loyaltyRedemption = useCartStore((s) => s.loyaltyRedemption);
  const syncing = useCartStore((s) => s.syncing);
  const { validate } = useCartMutations();
  const router = useLocaleRouter();
  const mounted = useHydrated();

  const lines = mounted ? persistedLines : [];
  const subtotal = mounted ? persistedSubtotal : 0;
  const itemCount = mounted ? persistedItemCount : 0;

  const blockingErrors = validation?.isValid === false ? validation.errors : [];
  const priceChanged = Boolean(validation?.warnings?.some((w) => w.type === PRICE_CHANGED));
  const hasUnavailable = lines.some((line) => line.isSellable === false);

  const marketCurrency = useSelectedCatalogMarket()?.currencyCode;
  const currency = cartCurrency({
    totalsCurrency: totals?.currency ?? promotions?.context?.currencyCode,
    lines,
    marketCurrency,
  });

  const applicable = useApplicablePromotions();
  const quotePending = syncing && totals == null;
  const quotedShip = Number(totals?.shipping ?? 0);
  const discount = totals?.discount ?? 0;
  const shipDiscount = shippingDiscountAmount(promotions);
  const freeDeliveryUnlocked = (applicable.data?.progress?.marks ?? []).some(
    (mark) => mark.rewardType === "FREE_SHIPPING" && mark.state === "complete",
  );
  const shipping =
    !mounted || quotePending
      ? null
      : quotedShip > 0
        ? quotedShip
        : shipDiscount > 0
          ? shipDiscount
          : freeDeliveryUnlocked
            ? 0
            : null;
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
          shipping: quotedShip > 0 ? quotedShip : 0,
        });
  const extraShipping =
    totals && quotedShip > 0 && shipping != null ? Math.max(0, shipping - totals.shipping) : 0;
  const amountPayable =
    payable != null && extraShipping > 0 ? payable + extraShipping : payable;

  /**
   * Guide: always re-validate before checkout, and block the button when the
   * cart comes back invalid rather than letting checkout fail later.
   */
  async function goToCheckout() {
    if (lines.some((line) => line.isSellable === false)) return;
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

  const validating = validate.isPending;
  const checkoutDisabled = syncing || validating || blockingErrors.length > 0 || hasUnavailable;

  return {
    mounted,
    cartId,
    totals,
    lines,
    orderedLines: mounted ? bag.orderedLines : [],
    bundleLabel: bag.bundleLabel,
    setLineQuantity: bag.setLineQuantity,
    removeLine: bag.removeLine,
    isEmpty: lines.length === 0,
    itemCount,
    subtotal,
    currency,
    promotions,
    offers: applicable.data?.offers ?? [],
    employeeCheckout,
    loyaltyRedemption,
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
    hasUnavailable,
    validating,
    checkoutDisabled,
    goToCheckout,
  };
}
