import { apiGet, apiPost } from "@/lib/api/apiClient";
import { storefrontCartQuery } from "@/features/cart/api/cart.service";
import {
  readApplicablePromotions,
  type ApplicablePromotions,
  type GiftCardBalance,
} from "../types/promotions";

export async function fetchApplicablePromotions(
  cartId: string,
): Promise<ApplicablePromotions> {
  const params = storefrontCartQuery({ cartId });
  const data = await apiGet<ApplicablePromotions>(
    `/storefront/promotions/applicable?${params.toString()}`,
  );
  return readApplicablePromotions(data);
}

export async function checkGiftCardBalance(code: string): Promise<GiftCardBalance> {
  const params = storefrontCartQuery();
  const data = await apiPost<GiftCardBalance>(
    `/storefront/gift-cards/balance?${params.toString()}`,
    { code: code.trim() },
  );
  return {
    maskedCode: data.maskedCode ?? null,
    remainingBalance: data.remainingBalance ?? "0",
    currencyCode: data.currencyCode ?? null,
    status: data.status ?? null,
    expiresAt: data.expiresAt ?? null,
  };
}
