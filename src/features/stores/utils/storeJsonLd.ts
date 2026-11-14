import type { StoreCard, StoreDetail } from "../types";
import { openingHoursSpecification } from "./openingHours";
import { mapsUrl } from "./storeLinks";

/**
 * schema.org Store (a LocalBusiness) for the stores a page shows, with only
 * what the page shows. No aggregateRating: Google doesn't show self-served
 * review stars for local businesses, and the rating is Google's, not ours.
 */
function storeNode(store: StoreCard | StoreDetail, pageUrl: string, brandName?: string | null) {
  const detail = "photos" in store ? store : null;
  const hours = openingHoursSpecification(store);
  return {
    "@type": "Store",
    "@id": `${pageUrl}#store`,
    name: store.name,
    url: pageUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address,
      addressLocality: store.city || undefined,
      addressCountry: store.countryCode || undefined,
    },
    geo: { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude },
    telephone: store.phone || undefined,
    hasMap: mapsUrl(store),
    image: detail?.photos.length ? detail.photos.map((p) => p.url) : undefined,
    description: detail?.description || undefined,
    openingHoursSpecification: hours.length ? hours : undefined,
    parentOrganization: brandName?.trim() ? { "@type": "Organization", name: brandName.trim() } : undefined,
  };
}

/** One store page. */
export function storePageJsonLd(store: StoreDetail, pageUrl: string, brandName?: string | null) {
  return { "@context": "https://schema.org", ...storeNode(store, pageUrl, brandName) };
}

/** A list page (locator / area): each store points at its own page. */
export function storeListJsonLd(
  stores: Array<{ store: StoreCard; url: string }>,
  brandName?: string | null,
) {
  return {
    "@context": "https://schema.org",
    "@graph": stores.map(({ store, url }) => storeNode(store, url, brandName)),
  };
}
