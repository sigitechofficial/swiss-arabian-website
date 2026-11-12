import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

// Placeholder until the CMS page exists: kept out of search and the sitemap.
export async function generateMetadata(): Promise<Metadata> {
  const base = await pageMetadata({
    path: "/blog",
    title: "Journal",
    titleAr: "المدونة",
    description: "Stories, fragrance guides and news from Swiss Arabian.",
    descriptionAr: "قصص وأدلة عطور وأخبار من سويس أرابيان.",
  });
  return { ...base, robots: { index: false, follow: true } };
}

export default function BlogPage() {
  return (
    <FeaturePlaceholder
      title="Journal"
      description="Blog listing is waiting on CMS content."
    />
  );
}
