export type AppEnv = "local" | "dev" | "staging" | "production";

function readEnv(key: string, fallback = ""): string {
  return (process.env[key] ?? fallback).replace(/\/+$/, "");
}

function resolveAppEnv(): AppEnv {
  const value = readEnv("NEXT_PUBLIC_APP_ENV", "local");
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
  local: readEnv(
    "NEXT_PUBLIC_LOCAL_API_BASE_URL",
    "http://192.168.18.143:3000",
  ),
  dev: readEnv(
    "NEXT_PUBLIC_DEV_API_BASE_URL",
    "https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
  ),
  staging: readEnv("NEXT_PUBLIC_STAGING_API_BASE_URL"),
  production: readEnv("NEXT_PUBLIC_PRODUCTION_API_BASE_URL"),
};

const RETURN_URL_BY_ENV: Record<AppEnv, string> = {
  local: readEnv("NEXT_PUBLIC_LOCAL_RETURN_URL", "http://localhost:3000"),
  dev: readEnv("NEXT_PUBLIC_DEV_RETURN_URL"),
  staging: readEnv("NEXT_PUBLIC_STAGING_RETURN_URL"),
  production: readEnv("NEXT_PUBLIC_PRODUCTION_RETURN_URL"),
};

export const env = {
  appEnv: APP_ENV,
  apiBaseUrl: API_BASE_BY_ENV[APP_ENV],
  returnUrl: RETURN_URL_BY_ENV[APP_ENV],
  isDev: process.env.NODE_ENV === "development",
  flags: {
    mfa: readEnv("NEXT_PUBLIC_ENABLE_MFA") === "true",
    passwordReset: readEnv("NEXT_PUBLIC_ENABLE_PASSWORD_RESET", "true") === "true",
    oauth: readEnv("NEXT_PUBLIC_ENABLE_OAUTH") === "true",
    useDevSession:
      readEnv("NEXT_PUBLIC_USE_DEV_SESSION") === "true" &&
      process.env.NODE_ENV === "development",
  },
} as const;
