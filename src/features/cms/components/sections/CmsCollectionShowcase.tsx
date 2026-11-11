"use client";

import { LandingCollections } from "@/features/home/components/landing/LandingCollections";
import type { CmsLink } from "../../types/cmsHome.types";
import { resolveCmsLink, type CmsLinkContext } from "../../utils/resolveCmsLink";

export type CmsCollectionShowcaseData = {
  heading?: string | null;
  subtitle?: string | null;
  layoutVariant?: "grid" | "carousel";
  /** NAVIGATION: the main menu's collections, live (same as the built-in homepage). */
  source?: "MANUAL" | "NAVIGATION" | null;
  tiles?: Array<{
    id?: string;
    title?: string;
    supportingText?: string | null;
    ctaLabel?: string | null;
    href?: string | null;
    link?: CmsLink | null;
    desktopImage?: string | null;
    mobileImage?: string | null;
    image?: string | null;
  }>;
};

type Props = {
  data: CmsCollectionShowcaseData;
  linkContext?: CmsLinkContext;
};

export function CmsCollectionShowcase({ data, linkContext }: Props) {
  if (data.source === "NAVIGATION") {
    return (
      <LandingCollections
        heading={data.heading}
        subtitle={data.subtitle}
        variant={data.layoutVariant === "carousel" ? "carousel" : "grid"}
      />
    );
  }
  const items = (data.tiles ?? [])
    .filter((tile) => tile.title?.trim())
    .map((tile, index) => {
      const fromLink = resolveCmsLink(tile.link, linkContext);
      const href = tile.href?.trim() || fromLink || "/collections";
      const image =
        tile.desktopImage?.trim() ||
        tile.mobileImage?.trim() ||
        tile.image?.trim() ||
        null;
      return {
        id: tile.id?.trim() || `tile-${index}`,
        href,
        label: tile.title!.trim(),
        ctaLabel: tile.ctaLabel,
        image,
      };
    });

  if (!items.length) return null;

  return (
    <LandingCollections
      heading={data.heading}
      subtitle={data.subtitle}
      items={items}
      variant={data.layoutVariant === "carousel" ? "carousel" : "grid"}
    />
  );
}
