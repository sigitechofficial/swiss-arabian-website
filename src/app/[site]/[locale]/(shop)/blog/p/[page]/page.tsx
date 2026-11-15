import type { Metadata } from "next";
import { routePage } from "@/features/catalog/routes/listingRoutes";
import { BlogListing, blogListingMetadata } from "@/features/blog/routes/blogListingRoute";

/** /blog?page=N (the proxy serves page 2+ here; the address keeps ?page=N). */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return blogListingMetadata(routePage((await params).page));
}

export default async function BlogPageN({ params }: Props) {
  return <BlogListing page={routePage((await params).page)} />;
}
