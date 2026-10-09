"use client";

import { LandingStory } from "@/features/home/components/landing/LandingStory";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

export type CmsImageWithTextData = {
  image?: string;
  altText?: string | null;
  eyebrow?: string | null;
  heading?: string;
  body?: string | null;
  imagePosition?: "left" | "right";
  ctaLabel?: string | null;
  link?: CmsLink | null;
};

type Props = {
  data: CmsImageWithTextData;
  linkContext?: CmsLinkContext;
};

/**
 * Maps IMAGE_WITH_TEXT to the Homepage brand-story presentation
 * (`LandingStory`) so CMS editorial matches the live landing design.
 */
export function CmsImageWithText({ data, linkContext }: Props) {
  const image = data.image?.trim();
  const heading = data.heading?.trim();
  if (!image || !heading) return null;

  const href = resolveCmsLink(data.link, linkContext);

  return (
    <LandingStory
      eyebrow={data.eyebrow?.trim() || undefined}
      heading={heading}
      body={data.body?.trim() || undefined}
      imageUrl={image}
      imageAlt={data.altText?.trim() || heading}
      ctaHref={href}
      ctaLabel={data.ctaLabel?.trim() || "Read more"}
    />
  );
}
