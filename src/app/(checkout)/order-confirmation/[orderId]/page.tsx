import { OrderConfirmationView } from "@/features/checkout";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderConfirmationView orderId={orderId} />;
}
