import { resolveCatalogImageUrl } from "./resolveCatalogImageUrl";

export type CollectionCustomMetafields = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Banner values may be a URL string or JSON `{ url, name }`. */
export function metafieldMediaUrl(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^gid:\/\//i.test(trimmed)) return null;
    if (trimmed.startsWith("{")) {
      try {
        return metafieldMediaUrl(JSON.parse(trimmed) as unknown);
      } catch {
        return resolveCatalogImageUrl(trimmed);
      }
    }
    return resolveCatalogImageUrl(trimmed);
  }
  const record = asRecord(value);
  if (!record) return null;
  const url = record.url ?? record.src ?? record.href;
  return typeof url === "string" ? resolveCatalogImageUrl(url) : null;
}

export function metafieldPlainText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function pickCollectionBanners(
  metafields: CollectionCustomMetafields | null | undefined,
  languageCode?: string | null,
): { desktop: string | null; mobile: string | null } {
  const arabic = (languageCode ?? "").toLowerCase().startsWith("ar");
  const desktopAr = metafieldMediaUrl(metafields?.collection_banner_arabic);
  const mobileAr = metafieldMediaUrl(metafields?.collection_mobile_banner_arabic);
  const desktopEn = metafieldMediaUrl(metafields?.collection_banner);
  const mobileEn = metafieldMediaUrl(metafields?.collection_mobile_banner);

  const desktop = (arabic ? desktopAr : desktopEn) ?? desktopEn ?? desktopAr;
  const mobile =
    (arabic ? mobileAr : mobileEn) ?? mobileEn ?? mobileAr ?? desktop;

  return { desktop, mobile };
}

export function collectionCopyFromMetafields(
  metafields: CollectionCustomMetafields | null | undefined,
): { title: string | null; intro: string | null } {
  return {
    title: metafieldPlainText(metafields?.collection_name),
    intro:
      metafieldPlainText(metafields?.collection_description) ??
      metafieldPlainText(metafields?.seo_content),
  };
}
