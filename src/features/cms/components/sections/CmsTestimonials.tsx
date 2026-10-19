"use client";

import { LandingReviews } from "@/features/home/components/landing/LandingReviews";

export type CmsTestimonialsData = {
  eyebrow?: string | null;
  heading?: string | null;
  summaryLabel?: string | null;
  displayLimit?: number;
  items?: Array<{
    id?: string;
    body?: string;
    reviewerName?: string;
    productLabel?: string | null;
    rating?: number;
    verifiedBuyer?: boolean;
  }>;
};

export function CmsTestimonials({ data }: { data: CmsTestimonialsData }) {
  const items = (data.items ?? [])
    .filter((item) => item.body?.trim() && item.reviewerName?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `rev-${index}`,
      body: item.body!.trim(),
      reviewerName: item.reviewerName!.trim(),
      productLabel: item.productLabel,
      rating: item.rating,
      verifiedBuyer: Boolean(item.verifiedBuyer),
    }));

  if (!items.length) return null;

  return (
    <LandingReviews
      eyebrowText={data.eyebrow}
      heading={data.heading}
      summaryLabel={data.summaryLabel}
      items={items}
      displayLimit={data.displayLimit}
    />
  );
}
