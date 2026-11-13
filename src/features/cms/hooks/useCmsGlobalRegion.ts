"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { useMarket } from "@/providers/MarketProvider";
import {
  cmsGlobalKeys,
  fetchCmsGlobalRegion,
  firstSectionOfType,
  type CmsGlobalRegionSlug,
} from "../api/cmsGlobalRegion.service";
import type { CmsLink, CmsSection } from "../types/cmsHome.types";

/**
 * A site-wide CMS region (announcement bar, footer) for the selected market.
 * Content is published under the market's own language code, not the one in the address.
 */
export function useCmsGlobalRegion(slug: CmsGlobalRegionSlug) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const languageCode = useMarket().contentLanguage ?? "";
  return useQuery({
    queryKey: cmsGlobalKeys.region(slug, zoneCode, languageCode),
    queryFn: () => fetchCmsGlobalRegion({ slug, zoneCode, languageCode }),
    enabled: Boolean(zoneCode && languageCode),
    staleTime: 60_000,
  });
}

export type AnnouncementItem = { message: string; link: CmsLink | null };

export type AnnouncementBarContent = {
  items: AnnouncementItem[];
  rotationIntervalMs: number | null;
  backgroundColor: string | null;
  textColor: string | null;
};

function asLink(raw: unknown): CmsLink | null {
  if (!raw || typeof raw !== "object") return null;
  const link = raw as CmsLink;
  return link.type ? link : null;
}

/** The market's announcement bar: only its messages (fixed texts could promise what it doesn't offer). */
export function parseAnnouncementBar(sections: CmsSection[]): AnnouncementBarContent {
  const data = (firstSectionOfType(sections, "ANNOUNCEMENT_BAR")?.data ?? {}) as {
    enabled?: boolean;
    messages?: Array<{ message?: string; link?: unknown }>;
    backgroundColor?: string | null;
    textColor?: string | null;
    rotationIntervalMs?: number;
  };
  const items =
    data.enabled === false
      ? []
      : (data.messages ?? []).flatMap((m) => {
          const message = m?.message?.trim();
          return message ? [{ message, link: asLink(m.link) }] : [];
        });
  return {
    items,
    rotationIntervalMs: typeof data.rotationIntervalMs === "number" ? data.rotationIntervalMs : null,
    backgroundColor: data.backgroundColor || null,
    textColor: data.textColor || null,
  };
}

export function useAnnouncementBar(): AnnouncementBarContent {
  const { data } = useCmsGlobalRegion("announcement-bar");
  return useMemo(() => parseAnnouncementBar(data?.sections ?? []), [data]);
}

export type FooterSocialLink = { id: string; label: string; href: string };

export type FooterContent = {
  newsletterHeading: string | null;
  newsletterPlaceholder: string | null;
  newsletterButtonLabel: string | null;
  copyrightText: string | null;
  showPaymentBadges: boolean;
  socialLinks: FooterSocialLink[];
};

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

/** The market's footer region (newsletter wording, copyright, social links). */
export function parseFooterContent(sections: CmsSection[]): FooterContent {
  const data = (firstSectionOfType(sections, "FOOTER")?.data ?? {}) as Record<string, unknown>;
  const social = Array.isArray(data.socialLinks) ? (data.socialLinks as FooterSocialLink[]) : [];
  return {
    newsletterHeading: text(data.newsletterHeading),
    newsletterPlaceholder: text(data.newsletterPlaceholder),
    newsletterButtonLabel: text(data.newsletterButtonLabel),
    copyrightText: text(data.copyrightText),
    showPaymentBadges: data.showPaymentBadges !== false,
    socialLinks: social.filter((link) => Boolean(link && typeof link === "object")),
  };
}

export function useFooterContent(): FooterContent {
  const { data } = useCmsGlobalRegion("footer");
  return useMemo(() => parseFooterContent(data?.sections ?? []), [data]);
}
