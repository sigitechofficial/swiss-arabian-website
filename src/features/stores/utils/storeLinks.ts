import type { StoreCard } from "../types";

/** Site paths of the store locator (no language prefix). */
export const storesPath = () => "/stores";
export const storeAreaPath = (areaSlug: string) => `/stores/${areaSlug}`;
export const storePath = (store: Pick<StoreCard, "areaSlug" | "slug">) => `/stores/${store.areaSlug}/${store.slug}`;

/**
 * Google Maps directions to the shop: the exact Google listing when its place
 * id is known, otherwise the map pin.
 */
export function directionsUrl(store: Pick<StoreCard, "latitude" | "longitude" | "googlePlaceId" | "name">): string {
  const params = new URLSearchParams({ api: "1", destination: `${store.latitude},${store.longitude}` });
  if (store.googlePlaceId) params.set("destination_place_id", store.googlePlaceId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** The shop on Google Maps (its listing when known). */
export function mapsUrl(store: Pick<StoreCard, "latitude" | "longitude" | "googleMapsUri" | "googlePlaceId">): string {
  if (store.googleMapsUri) return store.googleMapsUri;
  const params = new URLSearchParams({ api: "1", query: `${store.latitude},${store.longitude}` });
  if (store.googlePlaceId) params.set("query_place_id", store.googlePlaceId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** "tel:+971526073835" from "+971 52 607 3835". */
export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** WhatsApp chat link ("https://wa.me/971526073835"). */
export const whatsappUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/** Great-circle distance in km (for "near me"). */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
