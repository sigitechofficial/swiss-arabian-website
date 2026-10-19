/** HttpOnly cookie name for CMS Draft preview session. */
export const CMS_PREVIEW_COOKIE = "sa_cms_preview";

export type CmsPreviewSession = {
  token: string;
  zoneCode: string;
  languageCode: string;
  /** unix ms */
  expiresAt: number;
};

export function encodePreviewSession(session: CmsPreviewSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodePreviewSession(raw: string | undefined): CmsPreviewSession | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as CmsPreviewSession;
    if (
      !parsed?.token ||
      !parsed.zoneCode ||
      !parsed.languageCode ||
      !parsed.expiresAt
    ) {
      return null;
    }
    if (Date.now() >= parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}
