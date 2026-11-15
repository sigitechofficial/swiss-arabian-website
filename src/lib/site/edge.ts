import { env } from "@/lib/config/env";

/**
 * The hosting edge in front of the brand websites (Azure Front Door, see
 * docs/multibrand/DEPLOYMENT_PLAN.md). Requests are served only when they come
 * through it, so the headers it sets can be trusted:
 *
 * - `x-azure-fdid`: the Front Door profile id; it must be one of
 *   `TRUSTED_EDGE_IDS` (server setting, comma-separated: two ids while a new
 *   profile takes over). Anyone reaching the app directly is refused.
 * - `x-forwarded-host`: the address the shopper used (Front Door sends the app
 *   its own host name).
 * - `x-client-country`: the visitor's country. Front Door's rule set first
 *   overwrites any value a client sent, then sets the country per market country
 *   (geo match), so the value is always Front Door's own.
 *
 * Staging and production must be configured; local and dev may run without an
 * edge (forwarded headers are then taken as sent).
 */
export const EDGE_ID_HEADER = "x-azure-fdid";
export const EDGE_COUNTRY_HEADER = "x-client-country";

export type EdgeCheck = "trusted" | "untrusted" | "misconfigured";

type EdgeEnv = { trustedEdgeIds?: string; appEnv?: string };

export function trustedEdgeIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

/** Staging and production serve only through the edge. */
export function edgeRequired(appEnv: string | undefined): boolean {
  return appEnv === "production" || appEnv === "staging";
}

function current(): Required<EdgeEnv> {
  return {
    trustedEdgeIds: process.env.TRUSTED_EDGE_IDS ?? "",
    appEnv: env.appEnv,
  };
}

/** Whether this request came through the configured edge. */
export function edgeCheck(headers: Headers, settings: EdgeEnv = current()): EdgeCheck {
  const ids = trustedEdgeIds(settings.trustedEdgeIds);
  if (!ids.length) return edgeRequired(settings.appEnv) ? "misconfigured" : "trusted";
  const sent = headers.get(EDGE_ID_HEADER)?.trim().toLowerCase() ?? "";
  return sent && ids.includes(sent) ? "trusted" : "untrusted";
}

/** Refuses to start a staging / production server that has no edge configured. */
export function assertEdgeConfigured(settings: EdgeEnv = current()): void {
  if (edgeRequired(settings.appEnv) && !trustedEdgeIds(settings.trustedEdgeIds).length) {
    throw new Error(
      `TRUSTED_EDGE_IDS is required when the website runs as ${settings.appEnv}: it serves only requests from its Front Door profile.`,
    );
  }
}

/** The visitor's country from the edge (call only for a trusted request). */
export function visitorCountry(headers: Headers): string | null {
  const value = headers.get(EDGE_COUNTRY_HEADER)?.trim().toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) && value !== "ZZ" && value !== "XX" ? value : null;
}
