// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseLocalStorefronts } from "@/lib/storefront/localStorefront";
import { assertRuntimeConfig, parseAppEnv } from "./runtime";

/** `KEY=value` lines of `.env.example` (comments and blank lines skipped). */
function readEnvExample(): Record<string, string> {
  const text = readFileSync(resolve(__dirname, "../../../.env.example"), "utf8");
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

/**
 * `cp .env.example .env.local` must give a website that starts and shows a page locally:
 * without STOREFRONT_HOST, plain localhost is no registered address and every page is
 * "Not found" (ADMIN_REVIEW_NOTES A7).
 */
describe(".env.example is a working local setup", () => {
  const example = readEnvExample();

  it("is a local environment that a started server accepts", () => {
    expect(parseAppEnv(example.APP_ENV)).toBe("local");
    expect(() => assertRuntimeConfig({ ...example, NODE_ENV: "production" })).not.toThrow();
  });

  it("maps plain localhost to a shop host", () => {
    expect(example.STOREFRONT_HOST).toMatch(/^[a-z0-9.-]+\.[a-z]+$/);
  });

  it("maps every *.localhost alias to a brand and a host", () => {
    const aliases = parseLocalStorefronts(example.LOCAL_STOREFRONTS ?? "");
    expect(aliases.size).toBe((example.LOCAL_STOREFRONTS ?? "").split(",").filter(Boolean).length);
    expect(aliases.get("sa")).toEqual({ brandCode: "SWISS_ARABIAN", host: example.STOREFRONT_HOST });
    expect(aliases.get("sp")?.brandCode).toBe("SAPIL");
  });
});
