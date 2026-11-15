"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { brandDisplayName } from "@/lib/brand";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";


import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { brandLink, brandLinkMinimal, brandWordmark } from "@/styles/siteChrome";
import { brandWordmarkFont } from "./brandWordmarkFont";
import { MediaImage } from "@/components/ui/MediaImage";
import { useStorefrontLogo } from "@/lib/storefront/StorefrontHostProvider";

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
  const logo = useStorefrontLogo();
  const t = useShopCopy();
  const locale = useShopLocale();
  if (wordmark) {
    return (
      <LocaleLink
        className={`${brandLink} ${brandWordmark} ${brandWordmarkFont.className}`}
        data-brand
        data-brand-wordmark
        href="/"
        aria-label={t("auth.homeAria", { brand: locale === "en" ? logo.name : brandDisplayName(locale) })}
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
      aria-label={t("auth.homeAria", { brand: locale === "en" ? logo.name : brandDisplayName(locale) })}
    >
      <MediaImage src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} loading="eager" />
    </LocaleLink>
  );
}
