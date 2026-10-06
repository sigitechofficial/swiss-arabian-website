"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchLoyaltyTransactions, fetchLoyaltyWallet } from "../api/loyalty.service";
import { loyaltyKeys } from "../api/loyalty.keys";

/** Current Market wallet. The query does not run until that market is known. */
export function useLoyaltyAccount() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode?.trim() || null);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode?.trim() || null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const market = zoneCode ? { zoneCode, currencyCode } : null;
  const canLoad = bootstrapped && isAuthenticated && market != null;

  const wallet = useApiQuery(
    loyaltyKeys.wallet(zoneCode ?? "", currencyCode ?? ""),
    () => {
      if (!market) throw new Error("Rewards market is not ready.");
      return fetchLoyaltyWallet(market);
    },
    { enabled: canLoad },
  );

  const transactions = useApiQuery(
    loyaltyKeys.transactions(zoneCode ?? "", currencyCode ?? ""),
    () => {
      if (!market) throw new Error("Rewards market is not ready.");
      return fetchLoyaltyTransactions(market);
    },
    {
      enabled: canLoad && wallet.isSuccess && wallet.data.availability === "ACTIVE",
    },
  );

  return { wallet, transactions, zoneCode, currencyCode, bootstrapped, isAuthenticated };
}
