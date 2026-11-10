import { shopCopy } from "@/lib/i18n/shopCopy";
import { type ShopLocale, withLocalePrefix } from "@/lib/i18n/localePath";
import type { OpeningHoursSpecification } from "@/lib/seo/openingHours";
import { absoluteUrl, requestOrigin } from "@/lib/seo/requestOrigin";

const URL_KEYS = new Set(["url", "item", "image", "@id"]);

/** Site paths in url/item/image fields become absolute addresses on this market's domain. */
export function absolutizeJsonLd(value: unknown, origin: string | null, key = ""): unknown {
  if (typeof value === "string") return URL_KEYS.has(key) ? absoluteUrl(origin, value) : value;
  if (Array.isArray(value)) return value.map((v) => absolutizeJsonLd(v, origin, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, absolutizeJsonLd(v, origin, k)]),
    );
  }
  return value;
}

export async function CatalogJsonLd({ data }: { data: Record<string, unknown> }) {
  const origin = await requestOrigin();
  const json = JSON.stringify(absolutizeJsonLd(data, origin)).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function productJsonLd(input: {
  name: string;
  description?: string;
  sku?: string;
  url: string;
  image?: string | null;
  images?: string[];
  brand?: string | null;
  price?: number | null;
  currency?: string | null;
  inStock?: boolean | null;
  rating?: { average: number; count: number } | null;
}) {
  const images = [...new Set([input.image, ...(input.images ?? [])].filter(Boolean))] as string[];
  const hasPrice = input.price != null && Number.isFinite(input.price) && Boolean(input.currency);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    sku: input.sku,
    url: input.url,
    image: images.length ? images : undefined,
    // The product's own brand, else the store's brand (SEO Management → Brand identity).
    brand: input.brand?.trim() ? { "@type": "Brand", name: input.brand.trim() } : undefined,
    // Price and stock: what Google shows in results (as Shopify's page does).
    offers: hasPrice
      ? {
          "@type": "Offer",
          url: input.url,
          price: input.price!.toFixed(2),
          priceCurrency: input.currency,
          availability:
            input.inStock === false
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        }
      : undefined,
    aggregateRating:
      input.rating && input.rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(input.rating.average.toFixed(2)),
            reviewCount: input.rating.count,
          }
        : undefined,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Products shown on a collection page, in order (first page). */
export function itemListJsonLd(name: string, urls: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: urls.map((url, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url,
    })),
  };
}

/** Home › page, for a page directly under the home page (site pages, FAQ, store list …). */
export function pageBreadcrumbJsonLd(
  locale: ShopLocale,
  page: { name: string; path: string },
) {
  return breadcrumbJsonLd([
    { name: shopCopy(locale, "home"), url: withLocalePrefix("/", locale) },
    { name: page.name, url: withLocalePrefix(page.path, locale) },
  ]);
}

/** Questions and answers shown on the page, as plain text (Google: FAQPage). */
export function faqPageJsonLd(entries: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export type StoreJsonLdInput = {
  /** Stable id within the page, used for the store's `@id` (`<url>#store-<id>`). */
  id: string;
  name: string;
  /** The page that lists the store. */
  url: string;
  /** Full address as shown on the page. */
  streetAddress?: string | null;
  addressLocality?: string | null;
  /** ISO country code of the market, e.g. "AE". */
  addressCountry?: string | null;
  telephone?: string | null;
  geo?: { latitude: number; longitude: number } | null;
  openingHours?: OpeningHoursSpecification[] | null;
};

/**
 * One physical shop (schema.org Store, a LocalBusiness) — only the fields the
 * page actually shows; missing ones are left out, never guessed.
 */
export function storeJsonLd(store: StoreJsonLdInput, brandName?: string | null) {
  const hasAddress = Boolean(store.streetAddress?.trim() || store.addressLocality?.trim());
  const geo =
    store.geo && Number.isFinite(store.geo.latitude) && Number.isFinite(store.geo.longitude)
      ? store.geo
      : null;
  return {
    "@type": "Store",
    "@id": `${store.url}#store-${store.id}`,
    name: store.name,
    url: store.url,
    address: hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: store.streetAddress?.trim() || undefined,
          addressLocality: store.addressLocality?.trim() || undefined,
          addressCountry: store.addressCountry?.trim() || undefined,
        }
      : undefined,
    geo: geo
      ? { "@type": "GeoCoordinates", latitude: geo.latitude, longitude: geo.longitude }
      : undefined,
    telephone: store.telephone?.trim() || undefined,
    openingHoursSpecification: store.openingHours?.length ? store.openingHours : undefined,
    parentOrganization: brandName?.trim()
      ? { "@type": "Organization", name: brandName.trim() }
      : undefined,
  };
}

/** Every shop on a store-list page, as one graph. */
export function storesJsonLd(stores: StoreJsonLdInput[], brandName?: string | null) {
  return {
    "@context": "https://schema.org",
    "@graph": stores.map((store) => storeJsonLd(store, brandName)),
  };
}
