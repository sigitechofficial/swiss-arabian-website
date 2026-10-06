import { env } from "@/lib/config/env";

export function resolveCatalogImageUrl(
  image: string | null | undefined,
): string | null {
  const raw = image?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const base = (env.catalogMediaBaseUrl || env.apiBaseUrl).replace(/\/+$/, "");
  return `${base}${path}`;
}
