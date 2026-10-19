"use client";

import { LandingHero } from "@/features/home/components/landing/LandingHero";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

export type CmsHeroBannerData = {
  desktopImage?: string;
  mobileImage?: string | null;
  eyebrow?: string | null;
  heading?: string;
  subheading?: string | null;
  ctaLabel?: string | null;
  link?: CmsLink | null;
  secondaryCtaLabel?: string | null;
  secondaryLink?: CmsLink | null;
};

type Props = {
  data: CmsHeroBannerData;
  linkContext?: CmsLinkContext;
};

export function CmsHeroBanner({ data, linkContext }: Props) {
  const desktop = data.desktopImage?.trim();
  if (!desktop) return null;

  const heading = data.heading?.trim();
  if (!heading) return null;

  const primaryHref = resolveCmsLink(data.link, linkContext);
  const secondaryHref = resolveCmsLink(data.secondaryLink, linkContext);

  return (
    <LandingHero
      eyebrow={data.eyebrow?.trim() || undefined}
      title={heading}
      lead={data.subheading?.trim() || undefined}
      desktopImage={desktop}
      mobileImage={data.mobileImage}
      primaryCta={
        primaryHref
          ? {
              href: primaryHref,
              label: data.ctaLabel?.trim() || "Shop now",
            }
          : null
      }
      secondaryCta={
        secondaryHref
          ? {
              href: secondaryHref,
              label: data.secondaryCtaLabel?.trim() || "Learn more",
            }
          : null
      }
    />
  );
}
