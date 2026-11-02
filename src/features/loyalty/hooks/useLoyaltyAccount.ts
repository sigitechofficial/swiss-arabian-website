"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  fetchLoyaltyTierHistory,
  fetchLoyaltyTransactions,
  fetchLoyaltyWallet,
} from "../api/loyalty.service";
import { loyaltyKeys, LOYALTY_ACTIVITY_PAGE_SIZE } from "../api/loyalty.keys";
import { coerceLoyaltyActivityPage } from "../types/loyalty";

/** Current Market wallet. The query does not run until that market is known. */
export function useLoyaltyAccount() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode?.trim() || null);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode?.trim() || null);
  const customerId = useAuthStore((s) => s.user?.id ?? "");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const market = zoneCode ? { zoneCode, currencyCode } : null;
  const canLoad = bootstrapped && isAuthenticated && Boolean(customerId) && market != null;

  const wallet = useApiQuery(
    loyaltyKeys.wallet(customerId, zoneCode ?? "", currencyCode ?? ""),
    () => {
      if (!market) throw new Error("Rewards market is not ready.");
      return fetchLoyaltyWallet(market);
    },
    { enabled: canLoad },
  );

  const transactions = useApiQuery(
    loyaltyKeys.transactions(customerId, zoneCode ?? "", currencyCode ?? ""),
    () => {
      if (!market) throw new Error("Rewards market is not ready.");
      return fetchLoyaltyTransactions(market, { limit: LOYALTY_ACTIVITY_PAGE_SIZE, offset: 0 });
    },
    {
      enabled: canLoad,
    },
  );

  const tierHistory = useApiQuery(
    loyaltyKeys.tierHistory(customerId, zoneCode ?? "", currencyCode ?? ""),
    () => {
      if (!market) throw new Error("Rewards market is not ready.");
      return fetchLoyaltyTierHistory(market);
    },
    {
      enabled: canLoad && wallet.isSuccess,
    },
  );

  return {
    wallet,
    transactions,
    activity: coerceLoyaltyActivityPage(transactions.data),
    market,
    tierHistory,
    zoneCode,
    currencyCode,
    bootstrapped,
    isAuthenticated,
  };
}
