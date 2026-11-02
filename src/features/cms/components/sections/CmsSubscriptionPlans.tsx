"use client";

import { useContext } from "react";
import { QueryClientContext } from "@tanstack/react-query";

import { LandingPlans, type LandingPlanCard } from "@/features/home/components/landing/LandingPlans";
import { listSubscriptionPlans } from "@/features/subscriptions/api/subscription.api";
import { subscriptionKeys } from "@/features/subscriptions/api/subscription.keys";
import type { PublicSubscriptionPlan } from "@/features/subscriptions/types/subscription.types";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";

import type { CmsLinkContext } from "../../utils/resolveCmsLink";

export type CmsSubscriptionPlansData = {
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  editorialPricingOnly?: boolean;
  plans?: Array<{
    id?: string;
    name?: string;
    displayPrice?: string;
    billingIntervalLabel?: string | null;
    description?: string | null;
    benefits?: string[] | null;
    featured?: boolean;
    badgeLabel?: string | null;
    ctaLabel?: string | null;
    link?: { type?: string; url?: string | null } | null;
  }>;
};

type Props = {
  data: CmsSubscriptionPlansData;
  linkContext?: CmsLinkContext;
};

function intervalLabel(unit: string | null | undefined): string {
  if (!unit || unit === "MONTH") return "/month";
  return `/${unit.toLowerCase()}`;
}

export function toLandingPlanCards(plans: PublicSubscriptionPlan[]): LandingPlanCard[] {
  return plans.map((plan, index) => {
    const featured = plans.length > 2 && index === 1;
    return {
      id: plan.planCode,
      name: plan.name,
      displayPrice: `${plan.currencyCode} ${plan.amount}`,
      billingIntervalLabel: intervalLabel(plan.intervalUnit),
      description: plan.description,
      featured,
      badgeLabel: featured ? "Most popular" : null,
      ctaLabel: "Start plan",
      href: `/subscriptions/${encodeURIComponent(plan.planCode)}`,
    };
  });
}

function LiveSubscriptionPlans({ data, zoneCode }: { data: CmsSubscriptionPlansData; zoneCode: string }) {
  const plans = useApiQuery(subscriptionKeys.plans(zoneCode), () => listSubscriptionPlans(zoneCode), {
    enabled: Boolean(zoneCode),
  });
  const cards = plans.isSuccess ? toLandingPlanCards(plans.data) : [];
  if (!cards.length) return null;

  return (
    <LandingPlans
      eyebrowText={data.eyebrow}
      heading={data.heading}
      description={data.description}
      plans={cards}
      editorialPricingOnly={false}
    />
  );
}

export function CmsSubscriptionPlans({ data }: Props) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode || state.selectedMarketId || "");
  const queryClient = useContext(QueryClientContext);
  if (!queryClient) return <section aria-label="Subscription plans" />;
  return <LiveSubscriptionPlans data={data} zoneCode={zoneCode} />;
}
