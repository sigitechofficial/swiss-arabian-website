"use client";

import { useCallback } from "react";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { amountPayableFrom, bundleLinesFirst, setBundleLineLabel } from "@/features/promotions";
import { useApplicablePromotions } from "@/features/promotions/hooks/useApplicablePromotions";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { removeItemOptimistic, setQuantityOptimistic } from "../api/optimisticCart";
import { cartCurrency } from "../utils/cartCurrency";

/** Whether a line is backed by the server cart (edits sync to the API). */
export function isRemoteLine(line: Pick<CartLine, "remote" | "cartItemId">): boolean {
  return Boolean(line.remote || line.cartItemId);
}

/**
 * The bag as the drawer shows it: lines (bundle sets first), counts, the
 * amount due from the server quote, and the line actions. Shared by every
 * brand's bag drawer; all numbers come from the cart API and promotions.
 */
export function useBag() {
  const lines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const syncing = useCartStore((s) => s.syncing);
  const validation = useCartStore((s) => s.validation);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());
  const promotions = useCartStore((s) => s.promotions);
  const cartId = useCartStore((s) => s.cartId);
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const removeLocalLine = useCartStore((s) => s.removeLine);
  const offers = useApplicablePromotions().data?.offers ?? [];

  const quotePending = syncing && totals == null;
  const marketCurrency = useSelectedCatalogMarket()?.currencyCode;
  const currency = cartCurrency({
    totalsCurrency: totals?.currency,
    lines,
    marketCurrency,
  });
  // Checkout reads the server cart, so hold it while a background sync is
  // still writing the latest bag changes, or while a line can't be sold.
  const checkoutBlocked =
    syncing || validation?.isValid === false || lines.some((line) => line.isSellable === false);
  const allUnavailable = lines.length > 0 && lines.every((line) => line.isSellable === false);
  const amountDue = quotePending
    ? null
    : (amountPayableFrom(promotions, [
        totals?.amountPayable != null ? String(totals.amountPayable) : null,
      ]) ?? subtotal);

  const setLineQuantity = useCallback(
    (line: CartLine, quantity: number) => {
      if (isRemoteLine(line)) setQuantityOptimistic(line.variantId, quantity);
      else updateLocalQuantity(line.variantId, quantity);
    },
    [updateLocalQuantity],
  );

  const removeLine = useCallback(
    (line: CartLine) => {
      if (isRemoteLine(line)) removeItemOptimistic(line.variantId);
      else removeLocalLine(line.variantId);
    },
    [removeLocalLine],
  );

  const orderedLines = lines.length ? bundleLinesFirst(lines, promotions) : [];
  const bundleLabel = (line: CartLine) => setBundleLineLabel(promotions, line, offers);

  return {
    cartId,
    lines,
    orderedLines,
    bundleLabel,
    totals,
    promotions,
    offers,
    subtotal,
    itemCount,
    syncing,
    quotePending,
    currency,
    checkoutBlocked,
    allUnavailable,
    amountDue,
    setLineQuantity,
    removeLine,
  };
}
