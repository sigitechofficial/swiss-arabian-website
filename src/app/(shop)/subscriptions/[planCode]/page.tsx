import { SubscriptionsPageView } from "@/features/subscriptions/components/SubscriptionsPageView";

type Props = { params: Promise<{ planCode: string }> };

export default async function SubscriptionPlanPage({ params }: Props) {
  const { planCode } = await params;
  return <SubscriptionsPageView lockedPlanCode={decodeURIComponent(planCode)} />;
}
