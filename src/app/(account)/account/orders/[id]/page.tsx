import type { Metadata } from "next";
import { AccountOrderDetailPageView } from "@/features/orders";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountOrderDetailPageView orderId={id} />;
}
