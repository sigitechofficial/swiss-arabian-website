import { SubscriptionCheckoutPageView } from "@/features/subscriptions/components/SubscriptionCheckoutPageView";

type Props = { params: Promise<{ planCode: string }> };

export default async function SubscriptionCheckoutPage({ params }: Props) {
  const { planCode } = await params;
  return <SubscriptionCheckoutPageView planCode={decodeURIComponent(planCode)} />;
}
