import { SubscriptionCheckoutPageView } from "@brand-ui";

type Props = { params: Promise<{ planCode: string }> };

export default async function SubscriptionCheckoutPage({ params }: Props) {
  const { planCode } = await params;
  return <SubscriptionCheckoutPageView planCode={decodeURIComponent(planCode)} />;
}
