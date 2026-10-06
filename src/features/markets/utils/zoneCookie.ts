export const ZONE_COOKIE = "sa-zone-code";
const MAX_AGE = 60 * 60 * 24 * 365;

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
