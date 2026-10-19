"use client";

import { LandingHero } from "@/features/home/components/landing/LandingHero";
import type { HeroSlide } from "@/features/home/constants/heroSlides";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

type Slide = {
  id?: string;
  desktopImage?: string;
  mobileImage?: string | null;
  altText?: string | null;
  objectPosition?: string | null;
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
};

export type CmsHeroSliderData = {
  slides?: Slide[];
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  showNavigation?: boolean;
  eyebrow?: string | null;
  heading?: string | null;
  subheading?: string | null;
  ctaLabel?: string | null;
  link?: CmsLink | null;
  secondaryCtaLabel?: string | null;
  secondaryLink?: CmsLink | null;
};

type Props = {
  data: CmsHeroSliderData;
  linkContext?: CmsLinkContext;
};

export function CmsHeroSlider({ data, linkContext }: Props) {
  const slides: HeroSlide[] = (data.slides ?? [])
    .filter((s) => s.desktopImage?.trim())
    .map((s, index) => ({
      id: s.id?.trim() || `slide-${index}`,
      image: s.desktopImage!.trim(),
      alt: s.altText?.trim() || s.heading?.trim() || "",
      objectPosition: s.objectPosition?.trim() || "50% 50%",
    }));

  if (!slides.length) return null;

  const primaryHref = resolveCmsLink(data.link, linkContext);
  const secondaryHref = resolveCmsLink(data.secondaryLink, linkContext);
  const first = data.slides?.[0];

  return (
    <LandingHero
      eyebrow={
        data.eyebrow?.trim() || first?.eyebrow?.trim() || undefined
      }
      title={
        data.heading?.trim() ||
        first?.heading?.trim() ||
        "East Meets West"
      }
      lead={
        data.subheading?.trim() ||
        first?.description?.trim() ||
        undefined
      }
      slides={slides}
      autoplay={data.autoplay}
      autoplayIntervalMs={data.autoplayIntervalMs}
      showNavigation={data.showNavigation}
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
