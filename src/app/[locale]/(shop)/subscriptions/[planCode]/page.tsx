import { SubscriptionsPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/features";

type Props = { params: Promise<{ planCode: string }> };

export default async function SubscriptionPlanPage({ params }: Props) {
  requireBrandFeature("subscriptions");
  const { planCode } = await params;
  return <SubscriptionsPageView lockedPlanCode={decodeURIComponent(planCode)} />;
}
