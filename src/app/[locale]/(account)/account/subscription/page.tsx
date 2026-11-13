import { AccountSubscriptionsPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

export default function AccountSubscriptionPage() {
  requireBrandFeature("subscriptions");
  return <AccountSubscriptionsPageView />;
}
