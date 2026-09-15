import { useApiQuery } from "@/lib/api/queryHooks";
import { marketsKeys } from "../api/markets.keys";
import { fetchStorefrontMarkets } from "../api/markets.service";

export function useStorefrontMarkets() {
  return useApiQuery(marketsKeys.list(), fetchStorefrontMarkets, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
