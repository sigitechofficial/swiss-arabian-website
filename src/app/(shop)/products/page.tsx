import { CatalogPageView } from "@/features/catalog";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { loadServerListing } from "@/lib/seo/catalogPage";

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
