"use client";

import Link from "next/link";
import { brandLink, brandLinkMinimal, brandWordmark } from "@/styles/siteChrome";
import { brandWordmarkFont } from "./brandWordmarkFont";

export function NavbarBrand({
  crop = false,
  wordmark = false,
  centered = false,
}: {
  crop?: boolean;
  wordmark?: boolean;
  centered?: boolean;
}) {
  if (wordmark) {
    return (
      <Link
        className={`${brandLink} ${brandWordmark} ${brandWordmarkFont.className}`}
        data-brand
        data-brand-wordmark
        href="/"
        aria-label="Swiss Arabian home"
      >
        Swiss{"\u00A0"}Arabian
      </Link>
    );
  }

  return (
    <Link
      className={`${brandLink} ${centered ? brandLinkMinimal : ""}`}
      data-brand
      data-brand-crop={crop ? "" : undefined}
      href="/"
      aria-label="Swiss Arabian home"
    >
      <img src="/assets/sa-logo-clear.png" alt="Swiss Arabian" />
    </Link>
  );
}
