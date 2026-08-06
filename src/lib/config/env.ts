export type AppEnv = "local" | "dev" | "staging" | "production";

const AZURE_DEV_API =
  "https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io";

const LOCAL_LAN_API = "http://192.168.18.143:3000";

function stripSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property paths
 * (`process.env.NEXT_PUBLIC_FOO`). Dynamic `process.env[key]` breaks the toggle.
 */
function readPublic(value: string | undefined, fallback = ""): string {
  return stripSlash(value ?? fallback);
}

function resolveAppEnv(): AppEnv {
  const value = readPublic(process.env.NEXT_PUBLIC_APP_ENV, "dev");
  if (
    value === "local" ||
    value === "dev" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }
  return "dev";
}

const APP_ENV = resolveAppEnv();

/** `true` → LAN local API; otherwise Azure Dev. */
const USE_LOCAL_API =
  readPublic(process.env.NEXT_PUBLIC_USE_LOCAL_API) === "true";

const LOCAL_API_BASE = readPublic(
  process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL,
  LOCAL_LAN_API,
);
const DEV_API_BASE = readPublic(
  process.env.NEXT_PUBLIC_DEV_API_BASE_URL,
  AZURE_DEV_API,
);

const API_BASE_BY_ENV: Record<AppEnv, string> = {
  local: LOCAL_API_BASE,
  dev: DEV_API_BASE,
  staging: readPublic(
    process.env.NEXT_PUBLIC_STAGING_API_BASE_URL,
    AZURE_DEV_API,
  ),
  production: readPublic(
    process.env.NEXT_PUBLIC_PRODUCTION_API_BASE_URL,
    AZURE_DEV_API,
  ),
};

const RETURN_URL_BY_ENV: Record<AppEnv, string> = {
  local: readPublic(
    process.env.NEXT_PUBLIC_LOCAL_RETURN_URL,
    "http://localhost:3000",
  ),
  dev: readPublic(
    process.env.NEXT_PUBLIC_DEV_RETURN_URL,
    "http://localhost:3000",
  ),
  staging: readPublic(process.env.NEXT_PUBLIC_STAGING_RETURN_URL),
  production: readPublic(process.env.NEXT_PUBLIC_PRODUCTION_RETURN_URL),
};

const resolvedApiBase = USE_LOCAL_API
  ? LOCAL_API_BASE
  : API_BASE_BY_ENV[APP_ENV] || DEV_API_BASE;

export const env = {
  appEnv: APP_ENV,
  apiBaseUrl: resolvedApiBase,
  returnUrl: RETURN_URL_BY_ENV[APP_ENV],
  isDev: process.env.NODE_ENV === "development",
  flags: {
    /** Toggle LAN backend vs Azure Dev via NEXT_PUBLIC_USE_LOCAL_API */
    useLocalApi: USE_LOCAL_API,
    mfa: readPublic(process.env.NEXT_PUBLIC_ENABLE_MFA) === "true",
    passwordReset:
      readPublic(process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET, "true") ===
      "true",
    verification:
      readPublic(process.env.NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI) === "true",
    oauth: readPublic(process.env.NEXT_PUBLIC_ENABLE_OAUTH) === "true",
    useDevSession:
      readPublic(process.env.NEXT_PUBLIC_USE_DEV_SESSION) === "true" &&
      process.env.NODE_ENV === "development",
  },
  /**
   * Local QA only — mirrors backend CUSTOMER_MASTER_OTP when enabled.
   * Never set against production API builds.
   */
  masterOtp:
    process.env.NODE_ENV === "development"
      ? readPublic(process.env.NEXT_PUBLIC_CUSTOMER_MASTER_OTP)
      : "",
} as const;
