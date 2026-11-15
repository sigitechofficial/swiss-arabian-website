import type { Metadata } from "next";
import { collectionMetadata } from "@/features/catalog/routes/listingRoutes";
import { CollectionListing } from "@brand-ui";

/** A collection, prerendered per language on first visit and revalidated (ISR). */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return collectionMetadata((await params).slug, 1);
}

export default async function CollectionDetailPage({ params }: Props) {
  return <CollectionListing slug={(await params).slug} page={1} />;
}
