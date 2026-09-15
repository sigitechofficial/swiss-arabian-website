import { apiGet } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type {
  StorefrontMerchandisingDetailView,
  StorefrontProductCard,
} from "../types/merch";

export async function fetchMerchCollectionRail(
  slug: string,
): Promise<StorefrontMerchandisingDetailView | null> {
  const qs = new URLSearchParams(storefrontContextQuery());
  qs.set("includeProducts", "true");
  qs.set("productLimit", "12");
  try {
    const payload = await apiGet<StorefrontMerchandisingDetailView>(
      `/storefront/merchandising/collections/${encodeURIComponent(slug)}?${qs}`,
      { skipAuth: true },
    );
    const nested = (
      payload as StorefrontMerchandisingDetailView & {
        item?: { products?: StorefrontProductCard[] };
      }
    ).item?.products;
    return {
      ...payload,
      products: payload.products?.length ? payload.products : nested ?? [],
    };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}
