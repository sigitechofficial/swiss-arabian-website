import { env } from "@/lib/config/env";
import { getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/token";
import { endSession } from "@/lib/auth/endSession";
import { ApiClientError, type ApiErrorBody } from "./apiError";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta?: unknown;
};

type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
  skipAuth?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${env.apiBaseUrl}/store/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as ApiEnvelope<{
        accessToken: string;
        refreshToken?: string;
      }>;
      if (!json.success || !json.data?.accessToken) return false;
      setTokens(json.data.accessToken, json.data.refreshToken);
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

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
  });

  if (res.status === 401 && !options.skipAuth && !retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(method, path, body, options, true);
    }
    endSession();
    throw new ApiClientError(401, "Your session has expired. Please sign in again.");
  }

  let json: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new ApiClientError(res.status, "Unexpected response from server.");
    }
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
