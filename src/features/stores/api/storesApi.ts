import { apiGet } from "@/lib/api/apiClient";
import type { StoreAreaData, StoreDetail, StoreLocatorData, StoreSlugs } from "../types";

type MarketInput = { zoneCode: string; languageCode: string };

const query = (input: MarketInput) =>
  new URLSearchParams({ zoneCode: input.zoneCode, languageCode: input.languageCode || "en" }).toString();

const EMPTY: StoreLocatorData = { language: "en", areas: [], stores: [] };

/**
 * Published stores of the market (brand + market from the storefront host and
 * zone code), in the page's language. Empty on any failure so the page can
 * fall back to its placeholder.
 */
export async function fetchStoreLocator(input: MarketInput): Promise<StoreLocatorData> {
  if (!input.zoneCode) return EMPTY;
  try {
    const data = await apiGet<StoreLocatorData>(`/storefront/stores?${query(input)}`, { skipAuth: true });
    return { language: data.language ?? "en", areas: data.areas ?? [], stores: data.stores ?? [] };
  } catch {
    return EMPTY;
  }
}

/** One area page, or null when the area has no store on the website. */
export async function fetchStoreArea(input: MarketInput & { slug: string }): Promise<StoreAreaData | null> {
  if (!input.zoneCode || !input.slug) return null;
  try {
    return await apiGet<StoreAreaData>(`/storefront/stores/areas/${encodeURIComponent(input.slug)}?${query(input)}`, {
      skipAuth: true,
    });
  } catch {
    return null;
  }
}

/** One store page, or null when it isn't published in this market. */
export async function fetchStore(input: MarketInput & { slug: string }): Promise<StoreDetail | null> {
  if (!input.zoneCode || !input.slug) return null;
  try {
    return await apiGet<StoreDetail>(`/storefront/stores/${encodeURIComponent(input.slug)}?${query(input)}`, {
      skipAuth: true,
    });
  } catch {
    return null;
  }
}

/** Store and area addresses for the sitemap. */
export async function fetchStoreSlugs(input: { zoneCode: string }): Promise<StoreSlugs> {
  if (!input.zoneCode) return { areas: [], stores: [] };
  try {
    const data = await apiGet<StoreSlugs>(
      `/storefront/stores/slugs?${new URLSearchParams({ zoneCode: input.zoneCode }).toString()}`,
      { skipAuth: true },
    );
    return { areas: data.areas ?? [], stores: data.stores ?? [] };
  } catch {
    return { areas: [], stores: [] };
  }
}
