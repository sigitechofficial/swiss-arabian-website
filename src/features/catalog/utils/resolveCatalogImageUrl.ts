/**
 * A catalog image's address. Paths from the backend (`/catalog/media/…`) stay on
 * the website's own address, which forwards them to the backend (src/proxy.ts):
 * the same in every environment, so nothing is fixed at build time.
 */
export function resolveCatalogImageUrl(
  image: string | null | undefined,
): string | null {
  const raw = image?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  return raw.startsWith("/") ? raw : `/${raw}`;
}
