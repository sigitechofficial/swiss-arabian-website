import { z } from "zod";
import type { BrandEnvKey, BrandPublicEnv } from "./types";

/**
 * The build's brand code. Next.js only inlines NEXT_PUBLIC_* written as static
 * property paths, so it is spelled out. Environment settings are not build
 * settings (src/lib/config/runtime.ts).
 */
export function readProcessPublicEnv(): BrandPublicEnv {
  return {
    NEXT_PUBLIC_STOREFRONT_BRAND_CODE: process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE,
  };
}

/** Expected format of each build setting. */
export const BRAND_ENV_FORMATS: Record<BrandEnvKey, z.ZodType<string>> = {
  NEXT_PUBLIC_STOREFRONT_BRAND_CODE: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, "a brand code like SWISS_ARABIAN"),
};

/** Trimmed value without trailing slashes; "" when unset. */
export function envValue(raw: BrandPublicEnv, key: keyof BrandPublicEnv): string {
  return (raw[key] ?? "").trim().replace(/\/+$/, "");
}

/** This build's brand code ("" when unset: the default brand is used). */
export function buildBrandCode(): string {
  return envValue(readProcessPublicEnv(), "NEXT_PUBLIC_STOREFRONT_BRAND_CODE").toUpperCase();
}
