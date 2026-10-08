import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { fetchCollections } from "@/features/catalog/api/catalog.service";
import { withLocalePrefix } from "@/lib/i18n/localePath";

const STATIC_PATHS = ["/", "/products", "/collections", "/search"];

function absolute(origin: string, path: string) {
  return `${origin}${path === "/" ? "" : path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const proto = headerStore.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : "";
  const paths = new Set(STATIC_PATHS);

  try {
    const collections = await fetchCollections();
    for (const collection of collections) {
      if (collection.slug) paths.add(`/collections/${collection.slug}`);
    }
  } catch {
    // A missing market still publishes the static addresses.
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    const english = withLocalePrefix(path, "en");
    const arabic = withLocalePrefix(path, "ar");
    const languages = origin
      ? {
          en: absolute(origin, english),
          ar: absolute(origin, arabic),
          "x-default": absolute(origin, english),
        }
      : undefined;
    entries.push({
      url: origin ? absolute(origin, english) : english,
      alternates: languages ? { languages } : undefined,
    });
    entries.push({
      url: origin ? absolute(origin, arabic) : arabic,
      alternates: languages ? { languages } : undefined,
    });
  }
  return entries;
}
