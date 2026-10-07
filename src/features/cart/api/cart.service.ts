import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type { ApiCart } from "../types/cart";
import { getOrCreateGuestToken, getStoredCartId } from "../utils/guestToken";

type CartParamOpts = {
  skipGuestToken?: boolean;
  cartId?: string | null;
};

function buildCartParams(opts: CartParamOpts = {}): URLSearchParams {
  const params = new URLSearchParams(storefrontContextQuery());

  if (opts.cartId) {
    params.set("cartId", opts.cartId);
  }

  const isAuthenticated = Boolean(getAccessToken());
  if (!isAuthenticated && !opts.skipGuestToken) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }

  return params;
}

/** Same zone + guest query as other cart routes. */
export function storefrontCartQuery(opts: CartParamOpts = {}): URLSearchParams {
  return buildCartParams(opts);
}

export async function createOrResolveCart(
  opts: { cartId?: string | null } = {},
): Promise<ApiCart> {
  const params = buildCartParams({ cartId: opts.cartId });
  return apiPost<ApiCart>(`/storefront/cart?${params.toString()}`, {});
}

export async function getActiveCart(cartId?: string | null): Promise<ApiCart> {
  const params = buildCartParams({ cartId: cartId ?? getStoredCartId() });
  return apiGet<ApiCart>(`/storefront/cart?${params.toString()}`);
}

type AddItemOpts = {
  sku?: string;
  variantId?: string;
  quantity: number;
  cartId?: string | null;
};

export async function addCartItems(
  items: Array<{ sku: string; quantity: number }>,
  cartId?: string | null,
): Promise<ApiCart> {
  const params = buildCartParams({ cartId: cartId ?? getStoredCartId() });
  return apiPost<ApiCart>(`/storefront/cart/items/batch?${params.toString()}`, { items });
}

export async function addCartItem(opts: AddItemOpts): Promise<ApiCart> {
  const params = buildCartParams({ cartId: opts.cartId ?? getStoredCartId() });
  const body: Record<string, unknown> = { quantity: opts.quantity };
  if (opts.sku) {
    body.sku = opts.sku;
  } else if (opts.variantId) {
    body.variantId = opts.variantId;
  }
  return apiPost<ApiCart>(`/storefront/cart/items?${params.toString()}`, body);
}

type UpdateItemOpts = {
  cartItemId: string;
  quantity: number;
  cartId: string;
};

export async function updateCartItem(opts: UpdateItemOpts): Promise<ApiCart> {
  const params = buildCartParams({ cartId: opts.cartId });
  return apiPatch<ApiCart>(
    `/storefront/cart/items/${opts.cartItemId}?${params.toString()}`,
    { quantity: opts.quantity },
  );
}

type RemoveItemOpts = {
  cartItemId: string;
  cartId: string;
};

export async function removeCartItem(opts: RemoveItemOpts): Promise<ApiCart> {
  const params = buildCartParams({ cartId: opts.cartId });
  return apiDelete<ApiCart>(
    `/storefront/cart/items/${opts.cartItemId}?${params.toString()}`,
  );
}

export async function clearCartItems(cartId: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiDelete<ApiCart>(`/storefront/cart/items?${params.toString()}`);
}

export async function validateCart(cartId: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiPost<ApiCart>(`/storefront/cart/validate?${params.toString()}`, {
    cartId,
  });
}

export async function applyCartCoupon(cartId: string, code: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiPost<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/coupons?${params.toString()}`,
    { code: code.trim() },
  );
}

export async function removeCartCoupon(cartId: string, code: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiDelete<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/coupons/${encodeURIComponent(code.trim())}?${params.toString()}`,
  );
}

/** Sends the customer's free-gift choice. The cart quote that comes back is authoritative. */
export async function selectCartGift(
  cartId: string,
  sku: string,
  promotionCode?: string | null,
): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  const body: { sku: string; promotionCode?: string } = { sku: sku.trim() };
  if (promotionCode?.trim()) body.promotionCode = promotionCode.trim();
  return apiPost<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/gifts?${params.toString()}`,
    body,
  );
}

export async function applyCartGiftCard(
  cartId: string,
  code: string,
  amount?: string,
): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  const body: Record<string, string> = { code: code.trim() };
  if (amount?.trim()) body.amount = amount.trim();
  return apiPost<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/gift-cards?${params.toString()}`,
    body,
  );
}

export async function removeCartGiftCards(cartId: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiDelete<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/gift-cards?${params.toString()}`,
  );
}

/** Sends POINTS only. The server prices the reservation. */
export async function applyCartLoyaltyRedemption(
  cartId: string,
  points: number,
): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiPut<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/loyalty-redemption?${params.toString()}`,
    { points },
  );
}

export async function removeCartLoyaltyRedemption(cartId: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiDelete<ApiCart>(
    `/storefront/cart/${encodeURIComponent(cartId)}/loyalty-redemption?${params.toString()}`,
  );
}
