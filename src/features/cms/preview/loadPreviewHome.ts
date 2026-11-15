import { cookies, headers } from "next/headers";
import { configuredStorefrontHost } from "@/lib/api/storefrontHost";
import { fetchPreviewHome } from "../api/cmsContent.service";
import type { CmsHomeResult } from "../types/cmsHome.types";
import { CMS_PREVIEW_COOKIE, decodePreviewSession } from "./previewCookie";

export type CmsPreviewHome =
  /** No preview session (cookie missing or expired). */
  | { status: "expired" }
  /** Session ok, but the Draft has no enabled sections (or the token is wrong for the market). */
  | { status: "empty"; zoneCode: string; languageCode: string }
  | { status: "ready"; zoneCode: string; languageCode: string; result: CmsHomeResult };

/**
 * The admin's Draft homepage for /preview/home (server): reads the preview
 * cookie, asks the API for the Draft with the preview token. Shared by every
 * brand's `CmsPreviewHomeView`.
 */
export async function loadCmsPreviewHome(): Promise<CmsPreviewHome> {
  const jar = await cookies();
  const session = decodePreviewSession(jar.get(CMS_PREVIEW_COOKIE)?.value);
  if (!session) return { status: "expired" };
  const headerStore = await headers();
  const hostHeader =
    headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const storefrontHost =
    configuredStorefrontHost(hostHeader) || hostHeader.split(":")[0] || null;

  const result = await fetchPreviewHome({
    zoneCode: session.zoneCode,
    languageCode: session.languageCode,
    previewToken: session.token,
    storefrontHost,
  });
  const hasSections =
    Boolean(result.page) &&
    Array.isArray(result.sections) &&
    result.sections.length > 0;
  const base = { zoneCode: session.zoneCode, languageCode: session.languageCode };
  return hasSections ? { status: "ready", ...base, result } : { status: "empty", ...base };
}
