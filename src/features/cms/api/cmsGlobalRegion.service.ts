import { apiGet } from "@/lib/api/apiClient";
import type { CmsHomeResult, CmsSection } from "../types/cmsHome.types";

export type CmsGlobalRegionSlug = "announcement-bar" | "footer";

export const cmsGlobalKeys = {
  all: ["cms-global"] as const,
  region: (slug: CmsGlobalRegionSlug, zoneCode: string, locale: string) =>
    [...cmsGlobalKeys.all, slug, zoneCode, locale] as const,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapHome(raw: unknown): CmsHomeResult {
  const rec = asRecord(raw);
  const data = rec && "page" in rec ? rec : (asRecord(rec?.data) ?? {});
  const page = asRecord(data.page) as CmsHomeResult["page"];
  const sections = Array.isArray(data.sections)
    ? (data.sections as CmsSection[])
    : [];
  return { page: page ?? null, sections };
}

export async function fetchCmsGlobalRegion(input: {
  slug: CmsGlobalRegionSlug;
  zoneCode: string;
  languageCode: string;
}): Promise<CmsHomeResult> {
  const params = new URLSearchParams({
    zoneCode: input.zoneCode,
    languageCode: input.languageCode,
  });
  const raw = await apiGet<unknown>(
    `/storefront/content/regions/${input.slug}?${params.toString()}`,
    { skipAuth: true },
  );
  return unwrapHome(raw);
}

export function firstSectionOfType(
  sections: CmsSection[],
  type: string,
): CmsSection | null {
  return sections.find((s) => s.type === type) ?? sections[0] ?? null;
}
