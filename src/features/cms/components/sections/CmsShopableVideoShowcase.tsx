"use client";

import { LandingReel } from "@/features/home/components/landing/LandingReel";

export type CmsShopableVideoShowcaseData = {
  heading?: string | null;
};

export function CmsShopableVideoShowcase({
  data,
}: {
  data: CmsShopableVideoShowcaseData;
}) {
  return <LandingReel heading={data.heading} />;
}
