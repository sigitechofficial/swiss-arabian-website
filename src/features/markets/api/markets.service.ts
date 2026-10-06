import { apiGet } from "@/lib/api/apiClient";
import type { StorefrontMarketListResponse } from "../types/market";

export async function fetchStorefrontMarkets(): Promise<StorefrontMarketListResponse> {
  return apiGet<StorefrontMarketListResponse>("/storefront/markets", {
    skipAuth: true,
  });
}
