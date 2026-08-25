import { OrderDetailPageView } from "@/features/orders";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPageView id={id} />;
}
