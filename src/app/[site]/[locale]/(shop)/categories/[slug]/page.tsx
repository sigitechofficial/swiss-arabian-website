import type { Metadata } from "next";
import { categoryMetadata } from "@/features/catalog/routes/listingRoutes";
import { CategoryListing } from "@brand-ui";

/** A category, prerendered per language on first visit and revalidated (ISR). */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryMetadata((await params).slug, 1);
}

export default async function CategoryPage({ params }: Props) {
  return <CategoryListing slug={(await params).slug} page={1} />;
}
