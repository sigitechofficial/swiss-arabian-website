"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { brandLink, brandLinkMinimal, brandWordmark } from "@/styles/siteChrome";
import { brandWordmarkFont } from "./brandWordmarkFont";
import { MediaImage } from "@/components/ui/MediaImage";
import { storefrontLogo } from "@/lib/storefront/brand";

export function NavbarBrand({
  crop = false,
  wordmark = false,
  centered = false,
}: {
  crop?: boolean;
  wordmark?: boolean;
  centered?: boolean;
}) {
  // The brand's own logo, with a descriptive file name and alt text (SEO audit).
  const logo = storefrontLogo();
  if (wordmark) {
    return (
      <LocaleLink
        className={`${brandLink} ${brandWordmark} ${brandWordmarkFont.className}`}
        data-brand
        data-brand-wordmark
        href="/"
        aria-label={`${logo.name} home`}
      >
        {logo.name.replace(/ /g, "\u00A0")}
      </LocaleLink>
    );
  }

  return (
    <LocaleLink
      className={`${brandLink} ${centered ? brandLinkMinimal : ""}`}
      data-brand
      data-brand-crop={crop ? "" : undefined}
      href="/"
      aria-label={`${logo.name} home`}
    >
      <MediaImage src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} loading="eager" />
    </LocaleLink>
  );
}
