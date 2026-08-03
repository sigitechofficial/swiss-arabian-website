export type AppEnv = "local" | "dev" | "staging" | "production";

/**
 * NEXT_PUBLIC_* must be read via direct property access so Next.js can
 * inline them into the client bundle at build time.
 * Dynamic `process.env[key]` leaves lookups empty in the browser and
 * falls back to local defaults (wrong for Azure Dev).
 */
function trimUrl(value: string | undefined, fallback = ""): string {
  return (value ?? fallback).replace(/\/+$/, "");
}

function resolveAppEnv(): AppEnv {
  const value = trimUrl(process.env.NEXT_PUBLIC_APP_ENV, "local");
  if (
    value === "local" ||
    value === "dev" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }
  return "local";
}

const APP_ENV = resolveAppEnv();

const API_BASE_BY_ENV: Record<AppEnv, string> = {
  local: trimUrl(
    process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL,
    "http://localhost:3000",
  ),
  dev: trimUrl(
    process.env.NEXT_PUBLIC_DEV_API_BASE_URL,
    "https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
  ),
  staging: trimUrl(process.env.NEXT_PUBLIC_STAGING_API_BASE_URL),
  production: trimUrl(process.env.NEXT_PUBLIC_PRODUCTION_API_BASE_URL),
};

const RETURN_URL_BY_ENV: Record<AppEnv, string> = {
  local: trimUrl(process.env.NEXT_PUBLIC_LOCAL_RETURN_URL, "http://localhost:3000"),
  dev: trimUrl(
    process.env.NEXT_PUBLIC_DEV_RETURN_URL,
    "https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
  ),
  staging: trimUrl(process.env.NEXT_PUBLIC_STAGING_RETURN_URL),
  production: trimUrl(process.env.NEXT_PUBLIC_PRODUCTION_RETURN_URL),
};

export const env = {
  appEnv: APP_ENV,
  apiBaseUrl: API_BASE_BY_ENV[APP_ENV],
  returnUrl: RETURN_URL_BY_ENV[APP_ENV],
  isDev: process.env.NODE_ENV === "development",
  flags: {
    mfa: process.env.NEXT_PUBLIC_ENABLE_MFA === "true",
    passwordReset:
      (process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET ?? "true") === "true",
    oauth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === "true",
    useDevSession:
      process.env.NEXT_PUBLIC_USE_DEV_SESSION === "true" &&
      process.env.NODE_ENV === "development",
  },
} as const;
