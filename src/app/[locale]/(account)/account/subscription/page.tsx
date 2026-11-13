import { AccountSubscriptionsPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/features";

export default function AccountSubscriptionPage() {
  requireBrandFeature("subscriptions");
  return <AccountSubscriptionsPageView />;
}
