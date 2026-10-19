"use client";

import { LandingPlans } from "@/features/home/components/landing/LandingPlans";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

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
    link?: CmsLink | null;
  }>;
};

type Props = {
  data: CmsSubscriptionPlansData;
  linkContext?: CmsLinkContext;
};

export function CmsSubscriptionPlans({ data, linkContext }: Props) {
  const plans = (data.plans ?? [])
    .filter((plan) => plan.name?.trim() && plan.displayPrice?.trim())
    .map((plan, index) => ({
      id: plan.id?.trim() || `plan-${index}`,
      name: plan.name!.trim(),
      displayPrice: plan.displayPrice!.trim(),
      billingIntervalLabel: plan.billingIntervalLabel,
      description: plan.description,
      benefits: plan.benefits,
      featured: Boolean(plan.featured),
      badgeLabel: plan.badgeLabel,
      ctaLabel: plan.ctaLabel,
      href: resolveCmsLink(plan.link, linkContext) || "/subscriptions",
    }));

  if (!plans.length) return null;

  return (
    <LandingPlans
      eyebrowText={data.eyebrow}
      heading={data.heading}
      description={data.description}
      plans={plans}
      editorialPricingOnly={data.editorialPricingOnly !== false}
    />
  );
}
