"use client";

import { getImageProps } from "next/image";
import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";
import { pageContainer } from "@/styles/siteChrome";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";
import { CmsCtaLink } from "../CmsCtaLink";

export type CmsImageBannerData = {
  desktopImage?: string;
  mobileImage?: string | null;
  altText?: string | null;
  link?: CmsLink | null;
};

type Props = {
  data: CmsImageBannerData;
  linkContext?: CmsLinkContext;
};

/** The banner spans the page container (max 1200px). */
const BANNER_SIZES = "(max-width: 1200px) 100vw, 1200px";

/**
 * Responsive candidates via the optimiser, or the original file. The banner
 * keeps its natural height (`h-auto`), so no pixel size is needed: `fill`
 * only builds the width candidates here.
 */
function bannerSource(src: string): { src: string; srcSet?: string } {
  if (!isOptimizableImageSrc(src)) return { src };
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: BANNER_SIZES });
  return { src: props.src, srcSet: props.srcSet };
}

export function CmsImageBanner({ data, linkContext }: Props) {
  const desktop = data.desktopImage?.trim();
  if (!desktop) return null;
  const mobile = data.mobileImage?.trim() || desktop;
  const alt = data.altText?.trim() || "";
  const href = resolveCmsLink(data.link, linkContext);

  const large = bannerSource(desktop);
  const small = bannerSource(mobile);
  const media = (
    <picture>
      <source media="(max-width: 700px)" srcSet={small.srcSet ?? small.src} sizes={BANNER_SIZES} />
      <img
        src={large.src}
        srcSet={large.srcSet}
        sizes={BANNER_SIZES}
        alt={alt}
        className="block h-auto w-full object-cover"
        loading="lazy"
      />
    </picture>
  );

  return (
    <section className="bg-[var(--cream,#faf6ee)]" aria-label={alt || "Promotional banner"}>
      <div className={pageContainer}>
        {href ? (
          <CmsCtaLink href={href} className="block overflow-hidden rounded-lg">
            {media}
          </CmsCtaLink>
        ) : (
          <div className="overflow-hidden rounded-lg">{media}</div>
        )}
      </div>
    </section>
  );
}
