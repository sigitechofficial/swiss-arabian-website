import { getBrand } from "@/lib/brand";

/** Swiss Arabian's cookie name, unchanged (shoppers' saved markets keep working). */
const SWISS_ARABIAN_ZONE_COOKIE = "sa-zone-code";
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The market cookie's name for a brand. Cookies are shared by every port of
 * a host (localhost:3045 and :3046) and by sibling deployments on one domain,
 * so each brand keeps its own: Swiss Arabian `sa-zone-code`, others
 * `<brand>-zone-code` (Sapil: `sapil-zone-code`).
 */
export function zoneCookieName(brandCode: string): string {
  if (brandCode === "SWISS_ARABIAN") return SWISS_ARABIAN_ZONE_COOKIE;
  const slug = brandCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `${slug}-zone-code` : SWISS_ARABIAN_ZONE_COOKIE;
}

/** This deployment's market cookie (the brand is fixed per build). */
export const ZONE_COOKIE = zoneCookieName(getBrand().code);

export function readZoneCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ZONE_COOKIE}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]).trim() : "";
  return value || null;
}

export function writeZoneCookie(zoneCode: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ZONE_COOKIE}=${encodeURIComponent(zoneCode)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

/**
 * A stored market choice, only if it is one of this brand's markets (`zoneCodes`
 * from the markets API). A zone written by another brand on the same host, or a
 * market that no longer exists, is ignored.
 */
export function storedZoneFor(saved: string | null | undefined, zoneCodes: readonly string[]): string | null {
  const zone = saved?.trim() ?? "";
  return zone && zoneCodes.includes(zone) ? zone : null;
}
