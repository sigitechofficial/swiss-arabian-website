import { apiGet } from "@/lib/api/apiClient";
import { storefrontCartQuery } from "@/features/cart/api/cart.service";
import { readPromotionDiscovery, type PromotionDiscovery } from "../types/discovery";

export async function fetchPromotionDiscovery(productIds: string[] = []): Promise<PromotionDiscovery> {
  const params = storefrontCartQuery();
  const ids = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))].slice(0, 48);
  if (ids.length) params.set("productIds", ids.join(","));
  if (typeof document !== "undefined") {
    params.set("locale", document.documentElement.lang || "en");
  }
  const data = await apiGet<unknown>(`/storefront/promotions/discovery?${params.toString()}`);
  return readPromotionDiscovery(data);
}
