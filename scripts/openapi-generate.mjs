#!/usr/bin/env node
/**
 * Regenerates store API types from Swagger.
 * Set OPENAPI_SPEC_URL then: npm run openapi:generate
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const specUrl = process.env.OPENAPI_SPEC_URL;
if (!specUrl) {
  console.error("Set OPENAPI_SPEC_URL to your store Swagger JSON URL.");
  process.exit(1);
}

mkdirSync("src/types", { recursive: true });
execSync(
  `npx openapi-typescript "${specUrl}" -o src/types/storeApi.generated.d.ts`,
  { stdio: "inherit" },
);
console.log("Wrote src/types/storeApi.generated.d.ts");
