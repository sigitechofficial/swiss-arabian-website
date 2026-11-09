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
    brand: { "@type": "Brand", name: input.brand?.trim() || "Swiss Arabian" },
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
