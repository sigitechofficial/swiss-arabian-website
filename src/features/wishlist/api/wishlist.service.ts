import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
import {
  DEFAULT_ZONE_CODE,
  storefrontContextQuery,
  toAuthSalesChannelCode,
} from "@/lib/storefront/context";
import type {
  StorefrontWishlistAddResult,
  StorefrontWishlistClearResult,
  StorefrontWishlistListView,
  StorefrontWishlistRemoveResult,
  StorefrontWishlistStatusView,
} from "../types/wishlist";
import {
  uniqueProductUuids,
  WISHLIST_STATUS_BATCH_SIZE,
} from "../utils/productId";

function wishlistContextQuery(zoneCode?: string | null): string {
  return storefrontContextQuery({
    zoneCode: zoneCode?.trim() || DEFAULT_ZONE_CODE,
    salesChannelCode: toAuthSalesChannelCode(zoneCode),
  });
}

export async function fetchWishlist(
  opts: {
    zoneCode?: string | null;
    limit?: number;
    offset?: number;
  } = {},
): Promise<StorefrontWishlistListView> {
  const params = new URLSearchParams(wishlistContextQuery(opts.zoneCode));
  params.set("limit", String(opts.limit ?? 20));
  params.set("offset", String(opts.offset ?? 0));
  return apiGet<StorefrontWishlistListView>(
    `/storefront/customer/wishlist?${params.toString()}`,
  );
}

export async function fetchWishlistStatus(
  productIds: string[],
): Promise<StorefrontWishlistStatusView> {
  const ids = uniqueProductUuids(productIds).slice(
    0,
    WISHLIST_STATUS_BATCH_SIZE,
  );
  if (ids.length === 0) return { items: [] };
  const params = new URLSearchParams({ productIds: ids.join(",") });
  return apiGet<StorefrontWishlistStatusView>(
    `/storefront/customer/wishlist/status?${params.toString()}`,
  );
}

export async function addWishlistItem(
  productId: string,
  zoneCode?: string | null,
): Promise<StorefrontWishlistAddResult> {
  const qs = wishlistContextQuery(zoneCode);
  return apiPost<StorefrontWishlistAddResult>(
    `/storefront/customer/wishlist/items?${qs}`,
    { productId },
  );
}

export async function removeWishlistItem(
  productId: string,
): Promise<StorefrontWishlistRemoveResult> {
  return apiDelete<StorefrontWishlistRemoveResult>(
    `/storefront/customer/wishlist/items/${encodeURIComponent(productId)}`,
  );
}

export async function clearWishlist(): Promise<StorefrontWishlistClearResult> {
  return apiDelete<StorefrontWishlistClearResult>(
    "/storefront/customer/wishlist/items",
  );
}
