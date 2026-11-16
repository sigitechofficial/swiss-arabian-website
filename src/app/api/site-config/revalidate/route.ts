import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { checkSiteRefresh } from "@/lib/site/siteRefreshSignature";
import { siteIntegrationsTag } from "@/lib/site/siteIntegrations.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The backend calls this right after an integrations change (switchboard,
 * market payment methods, brand kill switch) with the addresses whose
 * settings changed, signed with SITE_REVALIDATE_SECRET (ADR-005 phase E). Each
 * address's cached settings expire now, so its pages render with the new ones on
 * the next visit (an Insider tag or promo switched off disappears at once).
 *
 * Expiry is per server instance's cache: with several instances and no shared
 * cache, the others catch up within 5 minutes (SITE_INTEGRATIONS_REVALIDATE_SECONDS).
 */
export async function POST(request: Request) {
  const body = await request.text();
  const check = checkSiteRefresh({
    secret: process.env.SITE_REVALIDATE_SECRET,
    timestamp: request.headers.get("x-site-timestamp"),
    signature: request.headers.get("x-site-signature"),
    body,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!check.ok) {
    return NextResponse.json(
      { revalidated: 0, message: check.message },
      { status: check.status, headers: { "cache-control": "no-store" } },
    );
  }
  for (const host of check.hosts) revalidateTag(siteIntegrationsTag(host), { expire: 0 });
  return NextResponse.json(
    { revalidated: check.hosts.length },
    { headers: { "cache-control": "no-store" } },
  );
}
