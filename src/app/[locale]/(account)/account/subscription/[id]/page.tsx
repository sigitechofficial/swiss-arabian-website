import { AccountSubscriptionDetailPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/features";

type Props = { params: Promise<{ id: string }> };

export default async function AccountSubscriptionDetailPage({ params }: Props) {
  requireBrandFeature("subscriptions");
  const { id } = await params;
  return <AccountSubscriptionDetailPageView id={id} />;
}
