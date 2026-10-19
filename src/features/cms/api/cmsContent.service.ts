import { apiGet } from "@/lib/api/apiClient";
import { env } from "@/lib/config/env";
import { resolveStorefrontHost } from "@/lib/api/storefrontHost";
import type { CmsHomeResult, CmsSection } from "../types/cmsHome.types";

export const cmsContentKeys = {
  all: ["cms-content"] as const,
  home: (zoneCode: string, locale: string) =>
    [...cmsContentKeys.all, "home", zoneCode, locale] as const,
  preview: (zoneCode: string, locale: string) =>
    [...cmsContentKeys.all, "preview", zoneCode, locale] as const,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapHome(raw: unknown): CmsHomeResult {
  const rec = asRecord(raw);
  const data = rec && "page" in rec ? rec : asRecord(rec?.data) ?? {};
  const page = asRecord(data.page) as CmsHomeResult["page"];
  const sections = Array.isArray(data.sections)
    ? (data.sections as CmsSection[])
    : [];
  return { page: page ?? null, sections };
}

/** Published homepage — never sends a preview token. */
export async function fetchPublishedHome(input: {
  zoneCode: string;
  languageCode: string;
}): Promise<CmsHomeResult> {
  const params = new URLSearchParams({
    zoneCode: input.zoneCode,
    languageCode: input.languageCode,
  });
  const raw = await apiGet<unknown>(
    `/storefront/content/pages/home?${params.toString()}`,
    { skipAuth: true },
  );
  return unwrapHome(raw);
}

/**
 * Draft preview via backend preview endpoint.
 * Token is sent only as `X-Content-Preview-Token` (never query/body).
 * Prefer calling from a server route that holds the token in an HttpOnly cookie.
 */
export async function fetchPreviewHome(input: {
  zoneCode: string;
  languageCode: string;
  previewToken: string;
  /** Optional host override for server-side calls */
  storefrontHost?: string | null;
}): Promise<CmsHomeResult> {
  const params = new URLSearchParams({
    zoneCode: input.zoneCode,
    languageCode: input.languageCode,
  });

  const headers: Record<string, string> = {
    "X-Content-Preview-Token": input.previewToken,
  };
  const host =
    input.storefrontHost?.trim() || (await resolveStorefrontHost()) || "";
  if (host) headers["X-Storefront-Host"] = host;

  const res = await fetch(
    `${env.apiBaseUrl}/storefront/content/pages/home/preview?${params.toString()}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    return { page: null, sections: [] };
  }
  const envelope = asRecord(json);
  return unwrapHome(envelope?.data ?? json);
}
