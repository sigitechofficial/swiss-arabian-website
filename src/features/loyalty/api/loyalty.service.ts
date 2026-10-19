import { apiGet, apiPost } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";
import { storefrontContextQuery } from "@/lib/storefront/context";
import {
  readEarnPreview,
  readLoyaltyActivityPage,
  readLoyaltyTierHistory,
  readLoyaltyWallet,
  readOrderReward,
  type LoyaltyActivityPageView,
  type LoyaltyEarnPreviewView,
  type LoyaltyOrderRewardView,
  type LoyaltyTierHistoryView,
  type LoyaltyWalletView,
} from "../types/loyalty";
import {
  readOmnichannelRefreshResult,
  type OmnichannelRefreshResult,
} from "../types/omnichannel";

export type LoyaltyMarketQuery = {
  zoneCode: string;
  currencyCode?: string | null;
};

export { LOYALTY_ACTIVITY_PAGE_SIZE } from "./loyalty.keys";

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

/**
 * Queues an async D365 omnichannel read refresh. Empty body — identity is the session.
 * Not a redemption, earn, or checkout sync.
 */
export async function requestOmnichannelRefresh(
  market: LoyaltyMarketQuery,
): Promise<OmnichannelRefreshResult> {
  const path = `/storefront/loyalty/omnichannel/refresh?${loyaltyQuery(market).toString()}`;
  try {
    const data = await apiPost<unknown>(path, undefined);
    const parsed = readOmnichannelRefreshResult(data);
    if (!parsed) {
      throw new Error("Store rewards can’t be refreshed right now.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 401) throw error;
      const fromBody = readOmnichannelRefreshResult(error.data);
      if (fromBody) return fromBody;
      const fromCode = readOmnichannelRefreshResult({
        status: error.code,
        retryAfterSeconds: error.context?.retryAfterSeconds,
      });
      if (fromCode) return fromCode;
      if (error.status === 429) {
        return {
          status: "THROTTLED",
          refreshRequestedAt: null,
          retryAfterSeconds: 30,
        };
      }
    }
    throw error;
  }
}

export async function fetchLoyaltyWallet(market: LoyaltyMarketQuery): Promise<LoyaltyWalletView> {
  const data = await apiGet<unknown>(`/storefront/loyalty/me?${loyaltyQuery(market).toString()}`);
  return readLoyaltyWallet(data);
}

export async function fetchLoyaltyTransactions(
  market: LoyaltyMarketQuery,
  page?: { limit?: number; offset?: number },
): Promise<LoyaltyActivityPageView> {
  const params = loyaltyQuery(market);
  if (page?.limit != null) params.set("limit", String(page.limit));
  if (page?.offset != null) params.set("offset", String(page.offset));
  const data = await apiGet<unknown>(`/storefront/loyalty/transactions?${params.toString()}`);
  return readLoyaltyActivityPage(data);
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
