import { getTranslator } from "@/lib/i18n/messages";
import { type ShopLocale, withLocalePrefix } from "@/lib/i18n/localePath";
import type { OpeningHoursSpecification } from "@/lib/seo/openingHours";
import { absoluteUrl, requestOrigin } from "@/lib/seo/requestOrigin";

const URL_KEYS = new Set(["url", "item", "image", "logo", "@id"]);

/** One id per page for the store's Organization, so products can name it as seller. */
export const ORGANIZATION_ID = "/#organization";
export const WEBSITE_ID = "/#website";

/** JSON-LD text: no HTML, no escaped "\n" left over from imports, single spaces. */
export function plainSchemaText(value: string | null | undefined): string | undefined {
  const text = (value ?? "")
    .replace(/\\[nrt]/g, " ")
    // A non-breaking space saved with the wrong encoding shows as "Â ".
    .replace(/Â(?=[\s ])/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

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
  /** The store selling it (market site name); linked to the home page Organization. */
  seller?: string | null;
  /** Market delivery promise: only real values are written, nothing is guessed. */
  shipping?: {
    country?: string | null;
    fee?: string | number | null;
    freeFrom?: string | number | null;
    minDays?: number | null;
    maxDays?: number | null;
  } | null;
  /** Shown facts such as fragrance notes and size (schema.org PropertyValue). */
  properties?: Array<{ name: string; value: string | null | undefined }>;
  /** Approved customer reviews shown on the page (newest first). */
  reviews?: Array<{
    rating: number;
    author?: string | null;
    title?: string | null;
    body?: string | null;
    date?: string | null;
  }>;
  inLanguage?: string;
}) {
  const images = [...new Set([input.image, ...(input.images ?? [])].filter(Boolean))] as string[];
  const hasPrice = input.price != null && Number.isFinite(input.price) && Boolean(input.currency);
  const properties = (input.properties ?? [])
    .map((p) => ({ name: p.name, value: plainSchemaText(p.value) }))
    .filter((p) => p.value);
  const reviews = (input.reviews ?? [])
    .filter((r) => Number.isFinite(r.rating) && r.rating > 0 && plainSchemaText(r.body ?? r.title))
    .slice(0, 5);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${input.url}#product`,
    name: input.name,
    description: plainSchemaText(input.description),
    sku: input.sku,
    url: input.url,
    ...(input.inLanguage ? { inLanguage: input.inLanguage } : {}),
    image: images.length ? images : undefined,
    // The product's own brand, else the store's brand (SEO Management → Brand identity).
    brand: input.brand?.trim() ? { "@type": "Brand", name: input.brand.trim() } : undefined,
    additionalProperty: properties.length
      ? properties.map((p) => ({ "@type": "PropertyValue", name: p.name, value: p.value }))
      : undefined,
    // Price, stock, seller and delivery: what Google shows in results and Shopping.
    offers: hasPrice
      ? {
          "@type": "Offer",
          url: input.url,
          ...(input.sku ? { sku: input.sku } : {}),
          price: input.price!.toFixed(2),
          priceCurrency: input.currency,
          availability:
            input.inStock === false
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          ...(input.seller?.trim()
            ? { seller: { "@type": "Organization", "@id": ORGANIZATION_ID, name: input.seller.trim() } }
            : {}),
          shippingDetails: offerShippingDetails(input.shipping, input.price!, input.currency!),
        }
      : undefined,
    aggregateRating:
      input.rating && input.rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(input.rating.average.toFixed(2)),
            reviewCount: input.rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: reviews.length
      ? reviews.map((r) => ({
          "@type": "Review",
          reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
          author: { "@type": "Person", name: r.author?.trim() || "Customer" },
          ...(r.title?.trim() ? { name: plainSchemaText(r.title) } : {}),
          ...(plainSchemaText(r.body) ? { reviewBody: plainSchemaText(r.body) } : {}),
          ...(r.date ? { datePublished: r.date.slice(0, 10) } : {}),
        }))
      : undefined,
  };
}

/**
 * schema.org OfferShippingDetails from the market's default delivery method.
 * Left out when the fee or the country is unknown (Google rejects partial data).
 */
export function offerShippingDetails(
  shipping: Parameters<typeof productJsonLd>[0]["shipping"],
  price: number,
  currency: string,
) {
  const country = shipping?.country?.trim().toUpperCase();
  const fee = shipping?.fee == null ? NaN : Number(shipping.fee);
  if (!country || !Number.isFinite(fee)) return undefined;
  const freeFrom = shipping?.freeFrom == null ? NaN : Number(shipping.freeFrom);
  // This product alone already reaches free delivery → its delivery costs nothing.
  const rate = Number.isFinite(freeFrom) && price >= freeFrom ? 0 : fee;
  const min = shipping?.minDays;
  const max = shipping?.maxDays ?? min;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: rate.toFixed(2), currency },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
    ...(min != null && max != null
      ? {
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            transitTime: { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" },
          },
        }
      : {}),
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
export async function pageBreadcrumbJsonLd(
  locale: ShopLocale,
  page: { name: string; path: string },
) {
  const t = await getTranslator(locale);
  return breadcrumbJsonLd([
    { name: t("home"), url: withLocalePrefix("/", locale) },
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
