"use client";

import { LandingFeatureCards } from "@/features/home/components/landing/LandingFeatureCards";

export type CmsTrustIndicatorsData = {
  items?: Array<{
    id?: string;
    image?: string | null;
    headingLine1?: string;
    headingLine2?: string | null;
    text?: string | null;
  }>;
};

export function CmsTrustIndicators({ data }: { data: CmsTrustIndicatorsData }) {
  const items = (data.items ?? [])
    .filter((item) => item.headingLine1?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `trust-${index}`,
      image: item.image,
      headingLine1: item.headingLine1!.trim(),
      headingLine2: item.headingLine2,
      text: item.text,
    }));

  if (!items.length) return null;
  return <LandingFeatureCards items={items} />;
}
