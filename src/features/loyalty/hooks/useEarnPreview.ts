"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchEarnPreview, fetchProductEarnPreview } from "../api/loyalty.service";
import { loyaltyKeys } from "../api/loyalty.keys";
import type { LoyaltyEarnPreviewView } from "../types/loyalty";

const GUEST: LoyaltyEarnPreviewView = { enabled: false, earningDisabled: false };

/** Market from the active storefront context; earning requires a signed-in customer. */
function useLoyaltyContext() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode?.trim() || null);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode?.trim() || null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  return { zoneCode, currencyCode, ready: bootstrapped && isAuthenticated };
}

/**
 * Cart or checkout earning estimate.
 *
 * The server recalculates from the persisted quote, so the cache key carries a
 * quote signature: any requote (quantity, promotion, removed line) refetches
 * instead of showing the previous number.
 */
export function useEarnPreview(target: {
  cartId?: string | null;
  checkoutSessionId?: string | null;
}) {
  const { zoneCode, currencyCode, ready } = useLoyaltyContext();
  const totals = useCartStore((s) => s.totals);
  const computedAt = useCartStore((s) => s.promotions?.computedAt ?? null);
  const discountTotal = useCartStore((s) => s.promotions?.totals?.discountTotal ?? null);

  const key = target.checkoutSessionId
    ? `session:${target.checkoutSessionId}`
    : target.cartId
      ? `cart:${target.cartId}`
      : "";

  // Quote identity only — never an input to a points calculation.
  const signature = [
    computedAt ?? "",
    discountTotal ?? "",
    totals?.subtotal ?? "",
    totals?.discount ?? "",
    totals?.totalQty ?? "",
  ].join("|");

  const query = useApiQuery(
    loyaltyKeys.earnPreview(zoneCode ?? "", key, signature),
    () => {
      if (!zoneCode || !key) return Promise.resolve(GUEST);
      return fetchEarnPreview({ zoneCode, currencyCode }, target);
    },
    { enabled: ready && Boolean(zoneCode) && Boolean(key) },
  );

  return { preview: ready ? query.data ?? null : null, isPending: query.isPending };
}

/**
 * PDP estimate from the server-resolved sell price. Bounded on purpose: the
 * backend models no promotion state here, so the cart figure can be lower.
 */
export function useProductEarnPreview(input: {
  unitPrice: number | null | undefined;
  quantity?: number;
}) {
  const { zoneCode, currencyCode, ready } = useLoyaltyContext();
  const unitPrice =
    input.unitPrice != null && Number.isFinite(input.unitPrice) && input.unitPrice > 0
      ? input.unitPrice.toFixed(2)
      : null;
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;

  const query = useApiQuery(
    loyaltyKeys.productEarn(zoneCode ?? "", unitPrice ?? "", quantity),
    () => {
      if (!zoneCode || !unitPrice) return Promise.resolve(GUEST);
      return fetchProductEarnPreview({ zoneCode, currencyCode }, { unitPrice, quantity });
    },
    { enabled: ready && Boolean(zoneCode) && Boolean(unitPrice) },
  );

  return { preview: ready ? query.data ?? null : null, isPending: query.isPending };
}
