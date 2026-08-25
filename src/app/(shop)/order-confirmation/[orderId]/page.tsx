import { Suspense } from "react";
import { OrderConfirmationView } from "@/features/checkout/components/OrderConfirmationView";

export const metadata = { title: "Order Confirmation" };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      }
    >
      <OrderConfirmationView orderId={orderId} />
    </Suspense>
  );
}
