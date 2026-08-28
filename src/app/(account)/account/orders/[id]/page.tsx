import { AccountOrderDetailPageView } from "@/features/account/components/AccountOrderDetailPageView";

export const metadata = { title: "Order Detail — Swiss Arabian" };

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountOrderDetailPageView orderId={id} />;
}
