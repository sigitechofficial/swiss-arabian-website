"use client";

import { usePathname } from "next/navigation";
import { useApiQuery } from "@/lib/api/queryHooks";
import { isShopUnavailablePath } from "@/lib/storefront/brand";
import { marketsKeys } from "../api/markets.keys";
import { fetchStorefrontMarkets } from "../api/markets.service";

export function useStorefrontMarkets() {
  const pathname = usePathname();
  return useApiQuery(marketsKeys.list(), fetchStorefrontMarkets, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !isShopUnavailablePath(pathname),
  });
}
