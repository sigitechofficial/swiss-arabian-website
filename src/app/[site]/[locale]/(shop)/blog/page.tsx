import type { Metadata } from "next";
import { BlogListing, blogListingMetadata } from "@/features/blog/routes/blogListingRoute";

/** /blog (page 1). Page 2+ (`/blog?page=N`) is served from `p/[page]`. */
export async function generateMetadata(): Promise<Metadata> {
  return blogListingMetadata(1);
}

export default function BlogPage() {
  return <BlogListing page={1} />;
}
