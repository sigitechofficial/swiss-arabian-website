import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/ui";
import { OrderConfirmationView } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <Suspense fallback={<PageLoading label="Loading your order…" fill />}>
      <OrderConfirmationView orderId={orderId} />
    </Suspense>
  );
}
