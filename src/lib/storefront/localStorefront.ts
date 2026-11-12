import { env } from "@/lib/config/env";

/**
 * Local only (NEXT_PUBLIC_APP_ENV=local): one dev server runs every brand,
 * picked by the first label of a `*.localhost` address.
 *
 *   http://sp.localhost:3004  → Sapil (shop host sapil.test, brand SAPIL)
 *   http://sa.localhost:3004  → the .env storefront (Swiss Arabian)
 *   http://localhost:3004     → the .env storefront (unchanged)
 *
 * NEXT_PUBLIC_LOCAL_STOREFRONTS replaces the built-in list:
 *   sp=SAPIL@sapil.test,sa=SWISS_ARABIAN@uae.swissarabian.com
 */
export type LocalStorefront = { brandCode: string; host: string };

const BUILT_IN_ALIASES = "sp=SAPIL@sapil.test";

function hostnameOnly(raw: string | null | undefined): string {
  return (raw ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function parseLocalStorefronts(raw: string): Map<string, LocalStorefront> {
  const map = new Map<string, LocalStorefront>();
  for (const entry of raw.split(",")) {
    const [alias, target] = entry.split("=").map((part) => part?.trim() ?? "");
    const [brandCode, host] = (target ?? "").split("@").map((part) => part?.trim() ?? "");
    if (!alias || !brandCode || !host) continue;
    map.set(alias.toLowerCase(), {
      brandCode: brandCode.toUpperCase(),
      host: hostnameOnly(host),
    });
  }
  return map;
}

/** `sp.localhost:3004` → `sp`; anything that is not `*.localhost` → null. */
export function localHostAlias(host: string | null | undefined): string | null {
  const name = hostnameOnly(host);
  if (!name.endsWith(".localhost")) return null;
  const alias = name.slice(0, -".localhost".length).split(".").filter(Boolean)[0];
  return alias && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(alias) ? alias : null;
}

/** The shop this local address stands for, or null to use the .env storefront. */
export function localStorefrontForHost(
  host: string | null | undefined,
  options: { appEnv?: string; aliases?: string } = {},
): LocalStorefront | null {
  if ((options.appEnv ?? env.appEnv) !== "local") return null;
  const alias = localHostAlias(host);
  if (!alias) return null;
  const aliases = options.aliases ?? (env.localStorefronts || BUILT_IN_ALIASES);
  return parseLocalStorefronts(aliases).get(alias) ?? null;
}
