import { brandConfigSchema, type BrandConfig } from "./types";

/**
 * Validates a brand config when its module loads, so a malformed brand file
 * fails tests, typecheck-adjacent CI and `npm run check:brand` straight away.
 */
export function defineBrand(config: BrandConfig): BrandConfig {
  const parsed = brandConfigSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Brand config "${config.code}" is invalid:\n${issues}`);
  }
  return Object.freeze(parsed.data) as BrandConfig;
}
