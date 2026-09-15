import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CollectionDetailPageView } from "@/features/collections";
import { fetchCollectionBySlug } from "@/features/catalog/api/catalog.service";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { ZONE_COOKIE } from "@/features/markets/utils/zoneCookie";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const zoneCode =
    (await cookies()).get(ZONE_COOKIE)?.value?.trim() || DEFAULT_ZONE_CODE;
  const collection = await fetchCollectionBySlug(slug, zoneCode);
  const title = collection?.seoTitle?.trim() || collection?.name || slug;
  const description = collection?.seoDescription?.trim() || undefined;
  return {
    title,
    description,
  };
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const listingQuery = parseCatalogListingParams(await searchParams);
  return <CollectionDetailPageView slug={slug} listingQuery={listingQuery} />;
}
