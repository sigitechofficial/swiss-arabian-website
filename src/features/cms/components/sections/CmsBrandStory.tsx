"use client";

import { LandingStory } from "@/features/home/components/landing/LandingStory";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

export type CmsBrandStoryData = {
  eyebrow?: string | null;
  heading?: string;
  paragraphs?: string[];
  image?: string | null;
  altText?: string | null;
  ctaLabel?: string | null;
  link?: CmsLink | null;
};

type Props = {
  data: CmsBrandStoryData;
  linkContext?: CmsLinkContext;
};

export function CmsBrandStory({ data, linkContext }: Props) {
  const heading = data.heading?.trim();
  if (!heading) return null;

  const body = (data.paragraphs ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");

  return (
    <LandingStory
      eyebrow={data.eyebrow?.trim() || undefined}
      heading={heading}
      body={body || undefined}
      imageUrl={data.image}
      imageAlt={data.altText}
      ctaHref={resolveCmsLink(data.link, linkContext)}
      ctaLabel={data.ctaLabel}
    />
  );
}
