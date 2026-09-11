import type { Metadata } from "next";
import { CategoryDetailPageView } from "@/features/collections/components/CategoryDetailPageView";

export const metadata: Metadata = {
  title: "Shop by category",
};

/** Navigation `CATEGORY` items link here (`/categories/:slug`). */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryDetailPageView slug={slug} />;
}
