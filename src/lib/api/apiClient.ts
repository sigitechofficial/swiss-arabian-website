import { env } from "@/lib/config/env";
import { getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/token";
import { endSession } from "@/lib/auth/endSession";
import { ApiClientError, type ApiErrorBody } from "./apiError";
import { resolveStorefrontHost } from "./storefrontHost";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  errors?: unknown[];
  meta?: { requestId?: string; path?: string; timestamp?: string };
};

type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
  skipAuth?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

const PUBLIC_AUTH_PATH =
  /^\/storefront\/auth\/(login|register|refresh|verify-|forgot-password|reset-password|otp\/|oauth\/(google|apple|code))/;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const storefrontHost = await resolveStorefrontHost();
      if (storefrontHost) headers["x-storefront-host"] = storefrontHost;
      const res = await fetch(`${env.apiBaseUrl}/storefront/auth/refresh`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as ApiEnvelope<{
        token?: {
          accessToken: string;
          refreshToken?: string;
        };
        accessToken?: string;
        refreshToken?: string;
      }>;
      const access = json.data?.token?.accessToken ?? json.data?.accessToken;
      const nextRefresh =
        json.data?.token?.refreshToken ?? json.data?.refreshToken;
      if (!json.success || !access) return false;
      setTokens(access, nextRefresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const storefrontHost = await resolveStorefrontHost();
  if (storefrontHost) headers.set("x-storefront-host", storefrontHost);

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
  });

  let json: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new ApiClientError(res.status, "Unexpected response from server.");
    }
  }

  const errorCode =
    json?.error && typeof json.error === "object" ? json.error.code : undefined;
  /** Business 401 (e.g. coupon needs login) — not a dead session. */
  const isBusinessUnauthorized = errorCode === "COUPON_REQUIRES_LOGIN";

  const canRefresh =
    res.status === 401 &&
    !isBusinessUnauthorized &&
    !options.skipAuth &&
    !retried &&
    !PUBLIC_AUTH_PATH.test(path);

  if (canRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(method, path, body, options, true);
    }
    endSession();
    throw new ApiClientError(
      401,
      "Your session has expired. Please sign in again.",
    );
  }

  if (!res.ok || json?.success === false) {
    throw new ApiClientError(
      res.status,
      json?.error ?? (text || "Request failed"),
    );
  }

  return (json?.data as T) ?? (undefined as T);
}

export function apiGet<T>(path: string, options?: RequestOptions) {
  return request<T>("GET", path, undefined, options);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>("POST", path, body, options);
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>("PATCH", path, body, options);
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>("PUT", path, body, options);
}

export function apiDelete<T>(path: string, options?: RequestOptions) {
  return request<T>("DELETE", path, undefined, options);
}

/** Expose refresh for session bootstrap (single-flight). */
export function refreshAccessToken(): Promise<boolean> {
  return tryRefresh();
}
