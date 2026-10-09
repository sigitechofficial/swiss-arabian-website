"use client";

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

export function CmsImageBanner({ data, linkContext }: Props) {
  const desktop = data.desktopImage?.trim();
  if (!desktop) return null;
  const mobile = data.mobileImage?.trim() || desktop;
  const alt = data.altText?.trim() || "";
  const href = resolveCmsLink(data.link, linkContext);

  const media = (
    <picture>
      <source media="(max-width: 700px)" srcSet={mobile} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktop}
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
