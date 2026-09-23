import { storefrontStorageKey } from "@/lib/storefront/brand";

const ACCESS_TOKEN_KEY = "sa_store_access_token";
const REFRESH_TOKEN_KEY = "sa_store_refresh_token";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function accessKey(): string {
  return storefrontStorageKey(ACCESS_TOKEN_KEY);
}

function refreshKey(): string {
  return storefrontStorageKey(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(accessKey());
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(refreshKey());
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (!canUseStorage()) return;
  localStorage.setItem(accessKey(), accessToken);
  if (refreshToken) {
    localStorage.setItem(refreshKey(), refreshToken);
  }
}

export function clearTokens(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(accessKey());
  localStorage.removeItem(refreshKey());
}
