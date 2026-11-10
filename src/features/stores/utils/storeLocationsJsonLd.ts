import { storesJsonLd, type StoreJsonLdInput } from "@/features/catalog/components/CatalogJsonLd";
import { openingHoursSpecification } from "@/lib/seo/openingHours";
import type { StoreLocation } from "../data/storesContent";

/**
 * Store-list entries → Store structured data, using only what the list shows
 * (name, address, phone, map pin, hours when they can be read exactly).
 * Emit it only on a page that renders these same stores.
 */
export function storeLocationsJsonLd(
  stores: readonly StoreLocation[],
  context: { pageUrl: string; brandName?: string | null; countryCode?: string | null },
) {
  const inputs: StoreJsonLdInput[] = stores.map((store) => ({
    id: store.id,
    name: store.name,
    url: context.pageUrl,
    streetAddress: store.address,
    addressCountry: context.countryCode,
    telephone: store.phone,
    geo: { latitude: store.lat, longitude: store.lng },
    openingHours: openingHoursSpecification(store.hours),
  }));
  return storesJsonLd(inputs, context.brandName);
}
