import { unstable_cache } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/config/env";
import {
  SITE_INTEGRATIONS_OFF,
  siteIntegrationsTag,
  type SiteIntegrations,
} from "./siteIntegrations.types";

/**
 * Fallback refresh: the backend tells the website to refresh an address's
 * settings right after a change (POST /api/site-config/revalidate); if that call
 * is lost, pages still pick the change up within this time.
 */
export const SITE_INTEGRATIONS_REVALIDATE_SECONDS = 300;
const FETCH_TIMEOUT_MS = 3_000;

const id = (pattern: RegExp) => z.string().trim().regex(pattern);
const optionalText = z.string().trim().min(1).max(200).nullable();

/** The backend answer, checked: a malformed value is dropped, never rendered into a tag. */
const responseSchema = z.object({
  marketCode: z.string().nullable(),
  analytics: z
    .object({
      gtmContainerId: id(/^GTM-[A-Z0-9]{4,12}$/).nullable(),
      ga4MeasurementId: id(/^G-[A-Z0-9]{4,16}$/).nullable(),
    })
    .nullable(),
  insiderTag: z
    .object({
      accountId: id(/^\d{4,12}$/),
      scriptHost: id(/^[a-z0-9.-]+\.[a-z]{2,}$/),
    })
    .nullable(),
  paymentPromos: z.object({
    tabby: z
      .object({
        merchantCode: optionalText,
        publicKey: id(/^pk_[A-Za-z0-9_-]+$/).nullable(),
      })
      .nullable(),
    tamara: z
      .object({
        merchantCode: optionalText,
        // Optional in the answer: without it the website shows plain wording, not Tamara's widget.
        publicKey: optionalText.optional().transform((value) => value ?? null),
      })
      .nullable(),
  }),
  googleMaps: z
    .object({
      browserKey: id(/^[A-Za-z0-9_-]{20,120}$/),
      mapId: id(/^[A-Za-z0-9_-]{1,64}$/).nullable(),
    })
    .nullable(),
  signIn: z.object({
    google: z.object({ clientId: id(/^[A-Za-z0-9._-]{8,200}$/) }).nullable(),
    apple: z.object({ clientId: id(/^[A-Za-z0-9._-]{3,200}$/) }).nullable(),
  }),
});

/**
 * Parses the backend answer. An integration whose values do not have the
 * expected shape is left off (each one on its own: a bad Maps key does not turn
 * analytics off).
 */
export function parseSiteIntegrations(raw: unknown): SiteIntegrations {
  const data = (raw && typeof raw === "object" && "data" in raw ? (raw as { data: unknown }).data : raw) as
    | Record<string, unknown>
    | null;
  if (!data || typeof data !== "object") return SITE_INTEGRATIONS_OFF;
  const shape = responseSchema.shape;
  const pick = <T,>(schema: z.ZodType<T>, value: unknown, fallback: T): T => {
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : fallback;
  };
  const promos = (data.paymentPromos ?? {}) as Record<string, unknown>;
  const promoShape = shape.paymentPromos.shape;
  const signIn = (data.signIn ?? {}) as Record<string, unknown>;
  const signInShape = shape.signIn.shape;
  return {
    marketCode: pick(shape.marketCode, data.marketCode, null),
    analytics: pick(shape.analytics, data.analytics, null),
    insiderTag: pick(shape.insiderTag, data.insiderTag, null),
    paymentPromos: {
      tabby: pick(promoShape.tabby, promos.tabby, null),
      tamara: pick(promoShape.tamara, promos.tamara, null),
    },
    googleMaps: pick(shape.googleMaps, data.googleMaps, null),
    signIn: {
      google: pick(signInShape.google, signIn.google, null),
      apple: pick(signInShape.apple, signIn.apple, null),
    },
  };
}

async function fetchSiteIntegrations(
  storefrontHost: string,
  marketCode: string | null,
): Promise<SiteIntegrations> {
  const query = marketCode ? `?market=${encodeURIComponent(marketCode)}` : "";
  const res = await fetch(`${env.apiBaseUrl}/storefront/site/integrations${query}`, {
    headers: { "x-storefront-host": storefrontHost },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  // An unknown address has no integrations (and that answer may be cached).
  if (res.status === 404) return SITE_INTEGRATIONS_OFF;
  // Thrown, so an outage is never cached as "everything off".
  if (!res.ok) throw new Error(`site integrations ${res.status}`);
  return parseSiteIntegrations(await res.json());
}

/**
 * The integration settings of a website address (the registered storefront
 * host the backend knows), for the market the page is drawn for on an address
 * that serves several markets (`marketCode`; ignored by the backend on a
 * market's own address). Cached per address and market under the address's tag,
 * so the backend's refresh call updates every market's pages of that address.
 * Backend unreachable: everything off for this render (never a stale or default
 * tag); the next render asks again.
 */
export async function loadSiteIntegrations(
  storefrontHost: string | null,
  marketCode: string | null = null,
): Promise<SiteIntegrations> {
  const host = storefrontHost?.trim().toLowerCase();
  if (!host || !env.apiBaseUrl) return SITE_INTEGRATIONS_OFF;
  const market = marketCode?.trim() || null;
  try {
    return await unstable_cache(
      () => fetchSiteIntegrations(host, market),
      ["site-integrations", host, market ?? ""],
      {
        revalidate: SITE_INTEGRATIONS_REVALIDATE_SECONDS,
        tags: [siteIntegrationsTag(host)],
      },
    )();
  } catch {
    return SITE_INTEGRATIONS_OFF;
  }
}
