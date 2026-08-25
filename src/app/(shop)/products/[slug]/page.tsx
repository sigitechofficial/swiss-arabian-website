import { ProductDetailPageView } from "@/features/catalog";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetailPageView slug={slug} />;
}
