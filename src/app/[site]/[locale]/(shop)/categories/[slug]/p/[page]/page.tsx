import type { Metadata } from "next";
import { categoryMetadata, routePage } from "@/features/catalog/routes/listingRoutes";
import { CategoryListing } from "@brand-ui";

/** /categories/[slug]?page=N (the proxy serves page 2+ here; the address keeps ?page=N). */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params;
  return categoryMetadata(slug, routePage(page));
}

export default async function CategoryPageN({ params }: Props) {
  const { slug, page } = await params;
  return <CategoryListing slug={slug} page={routePage(page)} />;
}
