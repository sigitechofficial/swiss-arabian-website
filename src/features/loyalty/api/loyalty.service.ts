import { apiGet } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import {
  readEarnPreview,
  readLoyaltyTransactions,
  readLoyaltyTierHistory,
  readLoyaltyWallet,
  readOrderReward,
  type LoyaltyEarnPreviewView,
  type LoyaltyOrderRewardView,
  type LoyaltyTierHistoryView,
  type LoyaltyTransactionView,
  type LoyaltyWalletView,
} from "../types/loyalty";

export type LoyaltyMarketQuery = {
  zoneCode: string;
  currencyCode?: string | null;
};

/** Commerce context only. Brand and customer stay on the trusted session. */
function loyaltyQuery(market: LoyaltyMarketQuery): URLSearchParams {
  const params = new URLSearchParams(
    storefrontContextQuery({
      zoneCode: market.zoneCode,
      currencyCode: market.currencyCode,
    }),
  );
  params.delete("brandId");
  params.delete("brandCode");
  params.delete("customerId");
  return params;
}

export async function fetchLoyaltyWallet(market: LoyaltyMarketQuery): Promise<LoyaltyWalletView> {
  const data = await apiGet<unknown>(`/storefront/loyalty/me?${loyaltyQuery(market).toString()}`);
  return readLoyaltyWallet(data);
}

export async function fetchLoyaltyTransactions(
  market: LoyaltyMarketQuery,
): Promise<LoyaltyTransactionView[]> {
  const data = await apiGet<unknown>(
    `/storefront/loyalty/transactions?${loyaltyQuery(market).toString()}`,
  );
  return readLoyaltyTransactions(data);
}

export async function fetchLoyaltyTierHistory(
  market: LoyaltyMarketQuery,
): Promise<LoyaltyTierHistoryView[]> {
  const data = await apiGet<unknown>(
    `/storefront/loyalty/tier-history?${loyaltyQuery(market).toString()}`,
  );
  return readLoyaltyTierHistory(data);
}

/**
 * Cart or checkout earning estimate. The server reads the discounts the quote
 * already persisted, so this must be refetched after every requote.
 */
export async function fetchEarnPreview(
  market: LoyaltyMarketQuery,
  target: { cartId?: string | null; checkoutSessionId?: string | null },
): Promise<LoyaltyEarnPreviewView> {
  const params = loyaltyQuery(market);
  if (target.checkoutSessionId) {
    params.set("checkoutSessionId", target.checkoutSessionId);
  } else if (target.cartId) {
    params.set("cartId", target.cartId);
  } else {
    return { enabled: false, earningDisabled: false };
  }
  const data = await apiGet<unknown>(`/storefront/loyalty/earn-preview?${params.toString()}`);
  return readEarnPreview(data);
}

/** PDP estimate. `unitPrice` is the server-resolved sell price, sent as text. */
export async function fetchProductEarnPreview(
  market: LoyaltyMarketQuery,
  input: { unitPrice: string; quantity?: number },
): Promise<LoyaltyEarnPreviewView> {
  const params = loyaltyQuery(market);
  params.set("unitPrice", input.unitPrice);
  if (input.quantity && input.quantity > 1) {
    params.set("quantity", String(input.quantity));
  }
  const data = await apiGet<unknown>(
    `/storefront/loyalty/product-earn-preview?${params.toString()}`,
  );
  return readEarnPreview(data);
}

/** Frozen order outcome. Not an estimate and not derived from the cart. */
export async function fetchOrderReward(orderId: string): Promise<LoyaltyOrderRewardView> {
  const data = await apiGet<unknown>(
    `/storefront/loyalty/orders/${encodeURIComponent(orderId)}`,
  );
  return readOrderReward(data);
}
