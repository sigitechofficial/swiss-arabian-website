import { CatalogPageView } from "@/features/catalog";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const listingQuery = parseCatalogListingParams(await searchParams);
  return <CatalogPageView listingQuery={listingQuery} />;
}
