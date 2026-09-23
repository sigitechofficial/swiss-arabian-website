import { apiGet } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type {
  FragranceNotesView,
  ShopableVideoView,
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

const EMPTY_SHOPABLE: ShopableVideoView = {
  context: {
    zoneId: null,
    zoneCode: null,
    salesChannelCode: null,
    languageCode: null,
    currencyCode: null,
    legalEntityCode: null,
  },
  available: false,
  sectionTitle: null,
  collection: null,
  slides: [],
};

export async function fetchShopableVideo(): Promise<ShopableVideoView> {
  const qs = storefrontContextQuery();
  try {
    const payload = await apiGet<ShopableVideoView>(
      `/storefront/merchandising/shopable-video?${qs}`,
      { skipAuth: true },
    );
    return {
      ...payload,
      available: Boolean(payload.available),
      slides: Array.isArray(payload.slides) ? payload.slides : [],
    };
  } catch (error) {
    if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
      return EMPTY_SHOPABLE;
    }
    throw error;
  }
}

const EMPTY_FRAGRANCE_NOTES: FragranceNotesView = {
  context: {
    zoneId: null,
    zoneCode: null,
    salesChannelCode: null,
    languageCode: null,
    currencyCode: null,
    legalEntityCode: null,
  },
  available: false,
  sectionTitle: null,
  collection: null,
  tiles: [],
};

export async function fetchFragranceNotes(): Promise<FragranceNotesView> {
  const qs = storefrontContextQuery();
  try {
    const payload = await apiGet<FragranceNotesView>(
      `/storefront/merchandising/fragrance-notes?${qs}`,
      { skipAuth: true },
    );
    return {
      ...payload,
      available: Boolean(payload.available),
      tiles: Array.isArray(payload.tiles) ? payload.tiles : [],
    };
  } catch (error) {
    if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
      return EMPTY_FRAGRANCE_NOTES;
    }
    throw error;
  }
}
