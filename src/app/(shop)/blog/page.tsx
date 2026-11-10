import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

// Placeholder until the CMS page exists: kept out of search and the sitemap.
export const metadata: Metadata = {
  title: "Journal",
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <FeaturePlaceholder
      title="Journal"
      description="Blog listing is waiting on CMS content."
    />
  );
}
