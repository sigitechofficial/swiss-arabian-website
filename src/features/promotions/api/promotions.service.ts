import { apiGet } from "@/lib/api/apiClient";
import { storefrontCartQuery } from "@/features/cart/api/cart.service";
import type { ApplicablePromotions } from "../types/promotions";

export async function fetchApplicablePromotions(
  cartId: string,
): Promise<ApplicablePromotions> {
  const params = storefrontCartQuery({ cartId });
  const data = await apiGet<ApplicablePromotions>(
    `/storefront/promotions/applicable?${params.toString()}`,
  );
  return {
    promotions: data.promotions,
    offers: data.offers ?? [],
  };
}
