"use client";

import { LandingPlans } from "@/features/home/components/landing/LandingPlans";
import { toLandingPlanCards } from "@/features/cms/components/sections/CmsSubscriptionPlans";
import { subscriptionKeys } from "@/features/subscriptions/api/subscription.keys";
import { listSubscriptionPlans } from "@/features/subscriptions/api/subscription.api";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";

export function HomeLivePlans() {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode || state.selectedMarketId || "");
  const plans = useApiQuery(subscriptionKeys.plans(zoneCode), () => listSubscriptionPlans(zoneCode), {
    enabled: Boolean(zoneCode),
  });
  if (plans.isSuccess && plans.data.length > 0) {
    return <LandingPlans plans={toLandingPlanCards(plans.data)} editorialPricingOnly={false} />;
  }
  if (plans.isPending || !zoneCode) return null;
  return <LandingPlans />;
}
