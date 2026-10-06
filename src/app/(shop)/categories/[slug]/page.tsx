import type { Metadata } from "next";
import { CategoryDetailPageView } from "@/features/collections/components/CategoryDetailPageView";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";

export const metadata: Metadata = {
  title: "Shop by category",
};

/** Navigation `CATEGORY` items link here (`/categories/:slug`). */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const listingQuery = parseCatalogListingParams(await searchParams);
  return <CategoryDetailPageView slug={slug} listingQuery={listingQuery} />;
}
