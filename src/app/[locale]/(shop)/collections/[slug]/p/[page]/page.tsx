import type { Metadata } from "next";
import { collectionMetadata, routePage } from "@/features/catalog/routes/listingRoutes";
import { CollectionListing } from "@brand-ui";

/** /collections/[slug]?page=N (the proxy serves page 2+ here; the address keeps ?page=N). */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params;
  return collectionMetadata(slug, routePage(page));
}

export default async function CollectionDetailPageN({ params }: Props) {
  const { slug, page } = await params;
  return <CollectionListing slug={slug} page={routePage(page)} />;
}
