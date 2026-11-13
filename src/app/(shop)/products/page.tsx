import type { Metadata } from "next";
import { CatalogPageView } from "@/features/catalog";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { loadServerListing } from "@/lib/seo/catalogPage";
import { pageMetadata } from "@/lib/seo/pageSeo";

/**
 * All products: title, canonical and hreflang like the other listings
 * (SEO Management can set its own text for "/products"). Page 2+ is its own
 * page for search engines (self-canonical).
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { page } = parseCatalogListingParams(await searchParams);
  const suffix = (locale: "en" | "ar") =>
    page > 1 ? ` – ${shopCopy(locale, "page")} ${page}` : "";
  const metadata = await pageMetadata({
    path: "/products",
    title: `${shopCopy("en", "allProducts")}${suffix("en")}`,
    titleAr: `${shopCopy("ar", "allProducts")}${suffix("ar")}`,
    listing: true,
  });
  if (page > 1) {
    const canonical = metadata.alternates?.canonical;
    const base = typeof canonical === "string" ? canonical : "/products";
    metadata.alternates = { ...metadata.alternates, canonical: `${base}?page=${page}` };
  }
  return metadata;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const listingQuery = parseCatalogListingParams(await searchParams);
  // Plain pages (no sort / price filter) are server-rendered so crawlers see the products.
  const serverRendered = !listingQuery.minPrice && !listingQuery.sort;
  const { listing, zoneCode } = serverRendered
    ? await loadServerListing("products", "", listingQuery.page)
    : { listing: null, zoneCode: "" };
  return (
    <CatalogPageView
      listingQuery={listingQuery}
      initialListing={listing}
      initialZoneCode={zoneCode}
    />
  );
}
