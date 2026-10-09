"use client";

import { LandingBundles } from "@/features/home/components/landing/LandingBundles";
import { mapCmsProducts } from "../../utils/mapCmsProduct";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

export type CmsBundlePromotionData = {
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  desktopImage?: string;
  mobileImage?: string | null;
  primaryCtaLabel?: string | null;
  primaryLink?: CmsLink | null;
  secondaryCtaLabel?: string | null;
  secondaryLink?: CmsLink | null;
  panelEnabled?: boolean;
  panelTitle?: string | null;
  panelCtaLabel?: string | null;
  panelLink?: CmsLink | null;
  products?: unknown;
};

type Props = {
  data: CmsBundlePromotionData;
  linkContext?: CmsLinkContext;
};

export function CmsBundlePromotion({ data, linkContext }: Props) {
  const desktop = data.desktopImage?.trim();
  if (!desktop) return null;

  const products = mapCmsProducts(data.products);

  return (
    <LandingBundles
      eyebrow={data.eyebrow}
      heading={data.heading}
      description={data.description}
      desktopImage={desktop}
      mobileImage={data.mobileImage}
      primaryCtaLabel={data.primaryCtaLabel}
      primaryCtaHref={resolveCmsLink(data.primaryLink, linkContext)}
      secondaryCtaLabel={data.secondaryCtaLabel}
      secondaryCtaHref={resolveCmsLink(data.secondaryLink, linkContext)}
      panelEnabled={data.panelEnabled !== false}
      panelTitle={data.panelTitle}
      panelCtaLabel={data.panelCtaLabel}
      panelCtaHref={resolveCmsLink(data.panelLink, linkContext)}
      products={products}
    />
  );
}
