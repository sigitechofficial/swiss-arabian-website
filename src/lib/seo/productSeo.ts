import type { SeoOverrideFields } from "@/lib/seo/pageSeo";

/** Admin product SEO (Products → SEO): brand values plus per-market overrides keyed by market id. */
export type ProductSeoPackage = SeoOverrideFields & {
  title?: string;
  description?: string;
  /** false = do not output the Product structured data. */
  schemaEnabled?: boolean;
  /** Full JSON-LD written by the admin; replaces the generated Product data. */
  schemaOverride?: string;
  marketOverrides?: Record<string, Record<string, unknown>>;
};

const TEXT_KEYS = [
  "title",
  "description",
  "canonicalUrl",
  "robots",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogImageAlt",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
  "schemaOverride",
] as const;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Brand values with this market's non-empty overrides on top. */
export function effectiveProductSeo(
  seo: ProductSeoPackage | null | undefined,
  zoneId?: string | null,
): Omit<ProductSeoPackage, "marketOverrides"> | null {
  if (!seo) return null;
  const market = (zoneId && seo.marketOverrides?.[zoneId]) || {};
  const out: Omit<ProductSeoPackage, "marketOverrides"> = {};
  for (const key of TEXT_KEYS) {
    const value = text(market[key]) ?? text(seo[key]);
    if (value) out[key] = value;
  }
  const enabled =
    typeof market.schemaEnabled === "boolean"
      ? market.schemaEnabled
      : seo.schemaEnabled;
  if (typeof enabled === "boolean") out.schemaEnabled = enabled;
  return out;
}

/** The admin's JSON-LD override as an object, or null when empty or not valid JSON. */
export function parseSchemaOverride(
  raw?: string,
): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
