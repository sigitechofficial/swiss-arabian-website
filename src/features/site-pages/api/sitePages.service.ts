import { cache } from "react";
import { apiGet } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";

export type SitePageKind = "PAGE" | "POLICY";

/** A text page or policy as shoppers see it in a market (its own version, else the brand version). */
export type SitePage = {
  kind: SitePageKind;
  handle: string;
  path: string;
  locale: string;
  locales: string[];
  title: string;
  bodyHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Shopify template, e.g. "contact": the page also shows the market's contact details. */
  templateSuffix: string | null;
  updatedAt: string;
};

export type SitePageListItem = {
  kind: SitePageKind;
  handle: string;
  path: string;
  locales: string[];
  titles: Record<string, string>;
  updatedAt: string;
};

/** The page in this market and language; null when it does not exist (or is hidden) there. */
export const fetchSitePage = cache(
  async (
    kind: SitePageKind,
    handle: string,
    locale: string,
    zoneCode: string,
  ) => {
    const qs = new URLSearchParams({
      locale,
      ...(zoneCode ? { zoneCode } : {}),
    });
    try {
      return await apiGet<SitePage>(
        `/storefront/website/pages/${kind}/${encodeURIComponent(handle)}?${qs.toString()}`,
        { skipAuth: true },
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) return null;
      throw error;
    }
  },
);

/** Pages and policies shown in the market (sitemap). */
export async function fetchSitePages(
  zoneCode: string,
): Promise<SitePageListItem[]> {
  const qs = zoneCode ? `?zoneCode=${encodeURIComponent(zoneCode)}` : "";
  const data = await apiGet<{ items?: SitePageListItem[] }>(
    `/storefront/website/pages${qs}`,
    {
      skipAuth: true,
    },
  );
  return data.items ?? [];
}
