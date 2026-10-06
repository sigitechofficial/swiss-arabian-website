import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <FeaturePlaceholder
      title={slug}
      description="Article body will be loaded from CMS."
    />
  );
}
