import { CollectionDetailPageView } from "@/features/collections";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CollectionDetailPageView slug={slug} />;
}
