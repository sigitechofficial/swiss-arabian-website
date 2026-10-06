import { apiGet, apiPost } from "@/lib/api/apiClient";
import { storefrontCartQuery } from "@/features/cart/api/cart.service";
import {
  readCompanionPreview,
  readProductCompanions,
  type CompanionPreview,
  type ProductCompanions,
} from "../types/companions";
import {
  readApplicablePromotions,
  type ApplicablePromotions,
  type GiftCardBalance,
} from "../types/promotions";
import { storefrontContextQuery } from "@/lib/storefront/context";
import { readEmptyBag, type EmptyBag } from "../types/emptyBag";
import { readOutOfStock, type OutOfStockState } from "../types/outOfStock";

export async function fetchApplicablePromotions(
  cartId: string,
): Promise<ApplicablePromotions> {
  const params = storefrontCartQuery({ cartId });
  const data = await apiGet<ApplicablePromotions>(
    `/storefront/promotions/applicable?${params.toString()}`,
  );
  return readApplicablePromotions(data);
}

export async function fetchProductCompanions(productId: string): Promise<ProductCompanions> {
  const params = new URLSearchParams(storefrontContextQuery());
  params.set("productId", productId);
  const data = await apiGet<unknown>(`/storefront/promotions/companions?${params.toString()}`);
  return readProductCompanions(data);
}

export async function previewProductCompanions(
  productId: string,
  selections: Array<{ sku: string }>,
): Promise<CompanionPreview> {
  const params = new URLSearchParams(storefrontContextQuery());
  const data = await apiPost<unknown>(
    `/storefront/promotions/companions/preview?${params.toString()}`,
    { productId, selections: selections.map((row) => ({ sku: row.sku, quantity: 1 })) },
  );
  return readCompanionPreview(data);
}

export async function fetchOutOfStock(productId: string): Promise<OutOfStockState> {
  const params = new URLSearchParams(storefrontContextQuery());
  params.set("productId", productId);
  const data = await apiGet<unknown>(`/storefront/promotions/out-of-stock?${params.toString()}`);
  return readOutOfStock(data);
}

export async function fetchEmptyBag(input: {
  campaignCode?: string | null;
  viewedProductIds?: string[];
  scope?: "viewed";
} = {}): Promise<EmptyBag> {
  const params = new URLSearchParams(storefrontContextQuery());
  if (input.campaignCode) params.set("campaignCode", input.campaignCode);
  if (input.scope) params.set("scope", input.scope);
  const viewed = (input.viewedProductIds ?? []).map((id) => id.trim()).filter(Boolean).slice(0, 12);
  if (viewed.length > 0) params.set("viewedProductIds", viewed.join(","));
  const data = await apiGet<unknown>(`/storefront/promotions/empty-bag?${params.toString()}`);
  return readEmptyBag(data);
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
