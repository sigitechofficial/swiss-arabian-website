#!/usr/bin/env node
/**
 * Build-time brand check. Run before `next build`:
 *
 *   npm run check:brand
 *
 * Loads env exactly like `next build` (process.env first, then
 * .env.production.local, .env.local, .env.production, .env), picks the brand
 * from NEXT_PUBLIC_STOREFRONT_BRAND_CODE and fails (exit 1) when a required
 * public id is missing for production, a value belongs to another brand, or
 * the host is not one of the brand's hosts. Rules: src/lib/brand/validate.ts.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

nextEnv.loadEnvConfig(root, false, { info: () => {}, error: console.error });

const jiti = createJiti(import.meta.url, {
  alias: { "@": path.join(root, "src") },
  interopDefault: true,
});

const { validateBrandEnv, formatBrandCheck } = await jiti.import(
  path.join(root, "src/lib/brand/validate.ts"),
);
const { BRAND_ENV_KEYS } = await jiti.import(path.join(root, "src/lib/brand/types.ts"));

const raw = { NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV };
for (const key of BRAND_ENV_KEYS) raw[key] = process.env[key];

const result = validateBrandEnv(raw);
const report = formatBrandCheck(result);
if (result.ok) {
  console.log(report);
} else {
  console.error(report);
  process.exit(1);
}
