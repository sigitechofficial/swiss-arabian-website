import { SubscriptionCheckoutPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

type Props = { params: Promise<{ planCode: string }> };

export default async function SubscriptionCheckoutPage({ params }: Props) {
  requireBrandFeature("subscriptions");
  const { planCode } = await params;
  return <SubscriptionCheckoutPageView planCode={decodeURIComponent(planCode)} />;
}
