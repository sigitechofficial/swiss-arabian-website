import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE, toAuthSalesChannelCode } from "@/lib/storefront/context";
import type { ApiCart } from "../types/cart";
import { getOrCreateGuestToken, getStoredCartId } from "../utils/guestToken";

// ─── Context params ────────────────────────────────────────────────────────

type CartParamOpts = {
  /** If true, skip guestToken even for unauthenticated requests (e.g. after login). */
  skipGuestToken?: boolean;
  cartId?: string | null;
};

/**
 * Build URLSearchParams for every cart API call.
 * - Always includes zoneCode + salesChannelCode.
 * - Appends guestToken for unauthenticated requests.
 * - Appends cartId when provided.
 */
function buildCartParams(opts: CartParamOpts = {}): URLSearchParams {
  const params = new URLSearchParams({
    zoneCode: DEFAULT_ZONE_CODE,
    salesChannelCode: toAuthSalesChannelCode(),
  });

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

// ─── Service functions ─────────────────────────────────────────────────────

/**
 * POST /storefront/cart
 * Create a new cart or return the existing active cart for this identity.
 * When called with a Bearer token, the backend auto-merges any guest cart.
 */
export async function createOrResolveCart(
  opts: { cartId?: string | null } = {},
): Promise<ApiCart> {
  const params = buildCartParams({ cartId: opts.cartId });
  return apiPost<ApiCart>(`/storefront/cart?${params.toString()}`, {});
}

/**
 * GET /storefront/cart
 * Fetch the active cart. Returns 404 (throws) if no cart exists yet.
 */
export async function getActiveCart(
  cartId?: string | null,
): Promise<ApiCart> {
  const params = buildCartParams({ cartId: cartId ?? getStoredCartId() });
  return apiGet<ApiCart>(`/storefront/cart?${params.toString()}`);
}

type AddItemOpts = {
  sku?: string;
  variantId?: string;
  quantity: number;
  cartId?: string | null;
};

/**
 * POST /storefront/cart/items
 * Add a product variant to the cart. Creates a cart automatically if cartId is absent.
 * At least one of sku or variantId is required (sku preferred).
 */
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

/**
 * PATCH /storefront/cart/items/:cartItemId
 * Update the quantity of a specific cart item. quantity must be >= 1.
 */
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

/**
 * DELETE /storefront/cart/items/:cartItemId
 * Remove a specific item from the cart.
 */
export async function removeCartItem(opts: RemoveItemOpts): Promise<ApiCart> {
  const params = buildCartParams({ cartId: opts.cartId });
  return apiDelete<ApiCart>(
    `/storefront/cart/items/${opts.cartItemId}?${params.toString()}`,
  );
}

/**
 * DELETE /storefront/cart/items
 * Remove all items from the cart (keeps the cart record).
 */
export async function clearCartItems(cartId: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiDelete<ApiCart>(`/storefront/cart/items?${params.toString()}`);
}

/**
 * POST /storefront/cart/validate
 * Re-validate all items against live pricing and inventory.
 * Always call before proceeding to checkout.
 */
export async function validateCart(cartId: string): Promise<ApiCart> {
  const params = buildCartParams({ cartId });
  return apiPost<ApiCart>(`/storefront/cart/validate?${params.toString()}`, {
    cartId,
  });
}
